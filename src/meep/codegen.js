const { IR, irToString } = require("./ir");

class CodeGen {
  constructor(ir) {
    this.code = ir;
    this.current = 0;
    this.out = "";
    this.stackLen = 0;
  }

  write(str) {
    this.out += str;
  }

  next() {
    return this.code[this.current++];
  }

  generate() {
    while (this.current < this.code.length) {
      let op = this.next();
      this.generateOp(op);
    }
    return this.out;
  }

  pop(isZeroed = false /* whether the stack top is already zero */) {
    if (!isZeroed) {
      this.write("[-]");
    }
    this.write("<");
    this.stackLen--;
  }

  push(value) {
    this.write(">" + "+".repeat(value));
    this.stackLen++;
  }

  generateOp(op) {
    switch (op) {
      case IR.val:
        let value = this.next();
        this.push(value);
        break;
      case IR.false_:
        // since false is 0, which is assumed to be the
        // default value of all memory cells, we push a blank value,
        // in other words, move up one cell.
        // [a, b] ----> [a, b, 0]
        //     ^               ^
        this.push(0);
        break;
      case IR.true_:
        // go up once cell and set it to 1.
        this.push(1);
        break;
      case IR.print:
        this.write("."); // print and pop the value off the stack
        this.pop();
        break;
      case IR.add: // pop 2 values off the stack, push the result back.
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
        this.pop(true);
        break;
      case IR.sub:
        // pretty much the same logic as addition.
        // so I'll write the whole thing at once.
        this.write("[<->-]<");
        break;
      case IR.equals: // pop 2 values off the stack, if they're equal, push 1, else push 0.
        // https://esolangs.org/wiki/Brainfuck_algorithms#x_.3D_x_.3D.3D_y
        this.write("<[->-<]+>[<->[-]]<");
        this.stackLen--;
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

        this.push(1); // execute the else-block if this flag is true,
        // if the then-block is executed, this flag is set to false.
        this.write("<"); // move the stack pointer one step back [c, 1]
        this.write("["); //                                       ^
        // after checking with the condition and entering the loop body,
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
        this.pop(); // pop the flag
        this.pop(); // pop the condition
        break;
      case IR.pop_:
        this.pop();
        break;
      case IR.start_loop:
        this.write("[");
        break;
      case IR.end_loop:
        this.write("]");
        this.pop(); // pop the condition off.
        break;
      case IR.popn:
        let count = this.next();
        for (let i = 0; i < count; i++) {
          this.pop();
        }
        break;
      case IR.get_var:
        // getting a variable involves
        // going down the stack to the variable's
        // slot and then copying into the top of the stack.
        let index = this.next();
        let depth = this.stackLen - index;
        this.push(0); // push an empty value on top of the stack.

        // intially our stack state looks like this: [a, ... , 0]
        //                                                     ^
        this.write("<".repeat(depth)); // go to the slot
        this.write("["); // repeat until the slot is 0.
        this.write(">".repeat(depth)); // go to top of stack
        this.write("+"); // increment the value at the top.
        this.write(">+"); // go one step forward, and increment that value too.
        this.write("<".repeat(depth + 1)); // go back to slot
        this.write("-"); // decrement.
        this.write("]" + ">".repeat(depth + 1)); // exit when the variable slot is zero.

        // after the move, our stack is : [0, ... a, a]
        //                                           ^

        // now we want to copy the topmost a back into the original slot.
        this.write("["); // start loop, stop when the data ptr is 0
        this.write("<".repeat(depth + 1)); // go to the original slot which is now 0.
        this.write("+"); // increment it.
        this.write(">".repeat(depth + 1)); // come back to the copy
        this.write("-"); // decrement.
        this.write("]<"); // repeat until copy is 0. and then pop it.
        break;
      default:
        throw new Error("Unhandled IR code.");
    }
  }
}

module.exports = CodeGen;
