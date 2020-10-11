const { IR, irToString } = require("./ir");

function printIR(ops) {
  for (let i = 0; i < ops.length; i++) {
    let op = ops[i];
    switch (op) {
      case IR.load_byte:
      case IR.load_string:
        console.log(irToString(op));
        console.log(ops[++i]);
        break;
      case IR.true_:
        console.log("TRUE");
        break;
      case IR.false_:
        console.log("FALSE");
        break;
      case IR.get_var:
        console.log("GET_VAR");
        console.log(ops[++i]);
        break;
      default:
        console.log(irToString(op));
    }
  }
}

module.exports = {
  printIR,
};
