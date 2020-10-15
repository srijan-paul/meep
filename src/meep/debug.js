const { IR, irToString } = require("./ir");

function printIR(ops) {
  for (let i = 0; i < ops.length; i++) {
    let op = ops[i];
    switch (op) {
      case IR.load_byte:
      case IR.load_string:
        console.log(irToString(op), ops[++i]);
        break;
      case IR.true_:
        console.log("TRUE");
        break;
      case IR.false_:
        console.log("FALSE");
        break;
      case IR.get_var:
      case IR.set_var:
      case IR.make_bus:
      case IR.index_var:
        console.log(irToString(op), ops[++i]);
        break;
      default:
        console.log(irToString(op));
    }
  }
}

module.exports = {
  printIR,
};
