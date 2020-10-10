const { IR } = require("./ir");

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
      case IR.equals: // pop 2 values off the stack, if they're equal, push 1, else push 0.
        // inital stack state: [a, b]
        //                         ^
        //  pointer at: b
        this.write("[");
        break;

      case IR.do_if:
        // Okay, so the way if statements work is kind of tricky.
        // Imagine the current state of the stack is simply [...]
        // where "..." refers to already existing values.

        // lets say the condition of the if-statement is 'c'
        // so we push two values onto the stack: [..., c, 1]
        //                                             ^
        // The c is the condition, and the 1 indicates whether the
        // if-body was executed or not.
        //

        this.push(1); // execute the else-body if this flag is true,
        // if the then-body is executed, this flag is set to false.
        this.write("<"); // move the stack pointer one step back [c, 1]
        this.write("["); //                                          ^
        // after checking with the condition and entering the loop body,
        // move the pointer back to the flag since we don't want to
        // overwrite it with local declarations.
        this.write(">");
        break;

      case IR.close_if_body:
        this.write("-"); // set the flag to false, to indicate
        // that the else block doesn't need to execute.

        this.write("]"); // close the then-block.
        break;

      case IR.start_else:
        this.write("[");
        break;
      case IR.end_else:
        this.write("]");
        break;
      case IR.end_if:
        this.pop(); // pop the flag
        this.pop(); // pop the condition
        break;
      default:
        throw new Error("Unhandled IR code.");
    }
  }
}

module.exports = CodeGen;
