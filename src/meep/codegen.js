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
        this.write("+".repeat(value) + ">");
        break;
      case IR.false_:
        this.write(">");
        break;
      case IR.true_:
        this.write("+>");
        break;
      default:
        throw new Error("Unhandled IR code.");
    }
  }
}

module.exports = CodeGen;
