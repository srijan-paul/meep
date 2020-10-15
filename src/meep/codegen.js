const { IR, irToString } = require("./ir");

const DataType = Object.freeze({
  Bus: 1,
  String: 2,
  Byte: 3,
});

// a single entry into the compile time
// stack
function StackEntry(type, size) {
  return { type, size };
}

class CodeGen {
  constructor(irs /* IR opcodes array */) {
    this.code = irs;
    this.current = 0;
    // output produced by the CodeGenerator.
    this.out = "";

    // this stack loosely mirrors
    // the state of the memory cells
    // at runtime.
    // this helps keep track of variables and literals
    // that are larger than 1 memory cell (1 byte).
    // for example, a load_string instruction loading a string of length 10
    // would push 10 into this stack. Whereas loading a single byte would push '1'.
    // each entry in the stack specifies how many bytes the value at that position is
    // at runtime.
    this.stack = [];
  }

  formatCode() {
    this.out = this.out.match(/.{1,80}/g).join("\n");
  }

  write(str) {
    this.out += str;
  }

  error(message) {
    throw new Error(message);
  }

  next() {
    return this.code[this.current++];
  }

  generate() {
    while (this.current < this.code.length) {
      let op = this.next();
      this.generateOp(op);
    }
    this.formatCode()
    return this.out;
  }

  getLocalDepth(index) {
    return this.stack.length - index - 1;
  }

  sizeOfVal(index) {
    return this.stack[index].size;
  }

  typeOfVal(index) {
    return this.stack[index].type;
  }

  stackTop() {
    return this.stack[this.stack.length - 1];
  }

  // takes the index of a local
  // variable and converts into
  // a stack offset.
  // [1, "abcd", 0]
  //             ^
  // here, if I want to get local variable 1, at slot 0
  // then I actually need to go down 5 steps.
  getMemoryOffset(depth) {
    let offset = 0;
    for (let i = depth; i >= 0; i--) {
      offset += this.sizeOfVal(this.stack.length - i - 1);
    }
    return offset - 1;
  }

  // print the value at the top
  // of the stack.
  printValue() {
    let size = this.sizeOfVal(this.stack.length - 1);
    const type = this.typeOfVal(this.stack.length - 1);
    let isPadded = false;

    if (type == DataType.String || type == DataType.Bus) {
      isPadded = true;
    }

    // if (isPadded) this.write(">>");
    this.write("<".repeat(size - 1));
    this.write(".[-]>".repeat(size - 1) + ".[-]");
    this.write("<".repeat(size));
    // if (isPadded) this.write("<<");

    this.stack.pop();
  }

  // copies a byte from a certain depth
  // into the stack to the top of the stack.
  // current position is assumed to be the top of the
  // stack when calling this function.
  copyByte(depth, silent = false) {
    // push an empty value on top of the stack. [...a, 0]
    //                                                 ^
    if (silent) {
      this.write(">");
    } else {
      this.pushByte(0);
    }

    this.write("<".repeat(depth + 1)); // go to the variable's slot
    this.write("["); // repeat until the slot is 0.
    this.write(">".repeat(depth + 1)); // go to top of stack
    this.write("+"); // increment the value at the top.
    this.write(">+"); // go one step forward, and increment that value too.
    this.write("<".repeat(depth + 2)); // go back to slot
    this.write("-"); // decrement.
    this.write("]" + ">".repeat(depth + 2)); // exit when the variable slot is zero.

    // after the move, our stack is : [0, ... a, a]
    //                                           ^

    // now we want to copy the topmost a back into the original slot.
    this.write("["); // start loop, stop when the data ptr is 0
    this.write("<".repeat(depth + 2)); // go to the original slot which is now 0.
    this.write("+"); // increment it.
    this.write(">".repeat(depth + 2)); // come back to the copy
    this.write("-"); // decrement.
    this.write("]<"); // repeat until copy is 0. and then pop it.
  }

  // removing a value from the stack
  // isn't as simple as emitting a "[-]<"
  // since sometimes values are larger than one byte,
  // in case of strings and arrays.
  // Forunately, it's not that complicated either.
  popValue() {
    let size = this.stack.pop().size;
    this.write("[-]<".repeat(size));
  }

  pop(isZeroed = false /* whether the stack top is already zero */) {
    if (isZeroed) {
      this.write("<");
      return;
    }
    this.popValue();
  }

  // set a byte at the given depth to value at the top of the stack, and pop.
  // Useful for mutating local variables. Note that this does NOT pop
  // the value from the compile-time stack, only zeroes it out and moves the BF data pointer
  // one step back.
  setByte(depth) {
    this.write("<".repeat(depth) + "[-]"); // go the value, and zero it
    this.write(">".repeat(depth)); // go back to the top of the stack
    this.write("["); // repeat until the value at tope is 0
    this.write(`-${"<".repeat(depth)}+${">".repeat(depth)}`); // decrement the stack-top and increment the target byte
    this.write("]"); // end loop.
    this.write("<"); // move pointer one step back.
  }

  // Push a byte to the top of the compile time stack, and also emit
  // BF code to do the same at runtime.
  pushByte(value) {
    this.write(">" + "+".repeat(value));
    this.stack.push(StackEntry(DataType.Byte, 1));
  }

  // copy a local variable from the given index to the top of the stack
  // [1, 2, "abcd", 1, 3] <- lets say we want to load "abcd"
  //                ^
  // In order to do that we first need to look up how far down the first byte
  // of "abcd" is, `getStackOffset` does exactly that. In this case, it's 5.
  // then we find out how big that value is. Here, "abcd" is 4 bytes long.
  // then we copy the memory cells one by one from that section of memory to the top.
  // [1, 2, "abcd", 1, 3, "abcd"]
  getVariable(index) {
    const depth = this.getLocalDepth(index); // depth of the local in the stack.
    const memoryOffset = this.getMemoryOffset(depth); // actual depth in BF memory.
    const size = this.sizeOfVal(index); // how many byes to copy.
    const type = this.typeOfVal(index);

    for (let i = 0; i < size; i++) {
      this.copyByte(memoryOffset, true);
    }

    this.stack.push(StackEntry(type, size));
  }

  // pop the value off the top of the stack
  // set the variable at slot "index" to this value
  setVariable(index) {
    // how far down the value is, in the compile time stack.
    const slot = this.getLocalDepth(index);
    // how far down the first byte of the variable will be in BF memory-tape
    const memoryOffset = this.getMemoryOffset(slot);
    const size = this.sizeOfVal(index);

    let stackTopSize = this.sizeOfVal(this.stack.length - 1);
    if (size != stackTopSize) {
      this.error(
        `Cannot assign value of size ${size} to value of size ${stackTopSize}`
      );
    }

    for (let i = 0; i < size; i++) {
      this.setByte(memoryOffset - size + 1);
    }
    this.stack.pop();
  }

  loadString(string) {
    const length = string.length;
    this.stack.push(StackEntry(DataType.String, length + 3));
    this.write(">>"); // two bytes of padding prior
    for (let i = 0; i < length; i++) {
      this.write(">" + "+".repeat(string.charCodeAt(i)));
    }
    this.write(">"); // 1 byte padding after.
  }

  generateOp(op) {
    switch (op) {
      case IR.load_byte:
        let value = this.next();
        this.pushByte(value);
        break;
      case IR.load_string:
        this.loadString(this.next());
        break;
      case IR.false_:
        // since false is 0, which is assumed to be the
        // default value of all memory cells, we push a blank value,
        // in other words, move up one cell.
        // [a, b] ----> [a, b, 0]
        //     ^               ^
        this.pushByte(0);
        break;
      case IR.true_:
        // go up once cell and set it to 1.
        this.pushByte(1);
        break;
      case IR.print:
        this.printValue();
        break;
      case IR.add: {
        // pop 2 values off the stack, push the result back.
        const sizeB = this.sizeOfVal(this.stack.length - 1);
        const sizeA = this.sizeOfVal(this.stack.length - 2);

        if (sizeA != sizeB) {
          this.error("'+' operator can only be used on byte sized numbers.");
        }

        // initally the stack state is: [... , a, b]
        //                                        ^
        // with the pointer pointing to b
        this.write("["); // start looping
        this.write("<"); // go back to slot 1
        this.write("+"); // increment
        this.write(">"); // go to stack slot 2
        this.write("-"); // decrement
        this.write("]"); //close loop
        // now, the stack state is [..., a + b, 0]
        //                                      ^
        // so we move the stack pointer one step back
        this.popValue();
        break;
      }
      case IR.sub: {
        // pretty much the same logic as addition.
        // so I'll write the whole thing at once.
        const sizeB = this.sizeOfVal(this.stack.length - 1);
        const sizeA = this.sizeOfVal(this.stack.length - 2);

        if (sizeA != 1 || sizeB != 1) {
          this.error("'-' operator can only be used on byte sized numbers.");
        }

        this.write("[<->-]");
        this.popValue();
        break;
      }
      case IR.not: {
        const topValue = this.stackTop();
        if (topValue.size != 1) {
          this.error("'!' operator can only be used on byte sized numbers.");
        }
        // this is pretty much the same approach as if statements
        // where we maintain a boolean flag right after the value to be not-ed
        // in memory , and then get rid of that once done. This is more or less an
        // if statement really.
        this.write(">+<[[-]>-<]>[-<+>]<");
        break;
      }
      case IR.equals: // pop 2 values off the stack, if they're equal, push 1, else push 0.
        // from here : https://esolangs.org/wiki/Brainfuck_algorithms#x_.3D_x_.3D.3D_y
        this.write("<[->-<]+>[<->[-]]<");
        this.stack.pop();
        break;
      case IR.start_if:
        // Okay, so the way if statements work is kind of tricky.
        // Imagine the current state of the stack is simply [...]
        // where "..." refers to already existing values.

        // lets say the condition of the if-statement is 'c'
        // so we push two values onto the stack: [..., c, 1]
        //                                             ^
        // The c is the condition, and the 1 indicates whether the
        // if-body was executed or not.
        //

        this.pushByte(1); // execute the else-block if this flag is true,
        // if the then-block is executed, this flag is set to false.
        this.write("<"); // move the stack pointer one step back [c, 1]
        this.write("["); //                                       ^
        // after checking with the condition and entering the then body,
        // move the pointer back to the flag since we don't want to
        // overwrite it with local declarations.
        this.write(">");
        break;

      case IR.close_if_body:
        // set the flag to false, to indicate
        // that the else block doesn't need to execute.
        this.write("-");

        // move the data pointer back to condition,
        // and reduce that to zero to make sure we exit.
        this.write("<[-]");
        this.write("]>"); // close the then-block, move pointer to flag.
        break;

      case IR.start_else:
        this.write("[");
        break;
      case IR.end_else:
        this.write("[-]]"); // zero out the flag to excute this only once.
        break;
      case IR.end_if:
        this.popValue(); // pop the flag
        this.popValue(); // pop the condition
        break;
      case IR.pop_:
        this.popValue();
        break;
      case IR.start_loop:
        if (this.stackTop().type != DataType.Byte) {
          this.error("While condition cannot be larger than 1 byte.");
        }
        // start the loop and pop the condition off the stack.
        this.write("[");
        this.popValue();
        break;
      case IR.end_loop:
        // revaluate the condition.
        this.write("]");
        this.popValue(); // pop the condition off.
        break;
      case IR.popn: {
        let count = this.next();
        for (let i = 0; i < count; i++) {
          this.popValue();
        }
        break;
      }
      case IR.get_var: {
        // getting a variable involves
        // going down the stack to the variable's
        // slot and then copying into the top of the stack.
        const index = this.next();
        this.getVariable(index);
        break;
      }
      case IR.set_var: {
        const varIndex = this.next();
        this.setVariable(varIndex);
        break;
      }
      case IR.make_bus:
        // at this point all the elements of the bus
        // are already loaded into the BF memory tape.
        // So all that needs to be done is to modify the
        // the Meep stack to ensure all those values are
        // represented as an aggregate.
        const length = this.next();
        // adjust the stack to represent the bus as a single
        // aggregate value instead of multiple variably sized values.

        let bytesRemoved = 0;

        for (let i = 0; i < length; i++) {
          bytesRemoved += this.stack.pop().size;
        }
        this.stack.push(StackEntry(DataType.Bus, bytesRemoved));

        break;
      case IR.mutate_bus:
        break;
      case IR.cmp_greater:
      case IR.cmp_less:
        this.error("comparison operators not yet implemented.");
        break;
      default:
        throw new Error("Unhandled IR code.");
    }
  }
}

module.exports = CodeGen;
