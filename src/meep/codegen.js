const { IR } = require("./ir");

class CodeGen {
  constructor(ir) {
    this.code = ir;
    this.current = 0;
    this.out = "";
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

  generateOp(op) {
    switch (op) {
      case IR.val:
        let value = this.next();
        this.write(">" + "+".repeat(value));
        break;
      case IR.false_:
        this.write(">");
        break;
      case IR.true_:
        this.write(">+");
        break;
      case IR.print:
        this.write(".>"); // print and pop the value off the stack
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
        this.write("<");
        break;
      default:
        throw new Error("Unhandled IR code.");
    }
  }
}

module.exports = CodeGen;
