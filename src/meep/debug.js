const { IR, irToString } = require("./ir");

function printIR(ops) {
  for (let i = 0; i < ops.length; i++) {
    let op = ops[i];
    switch (op) {
      case IR.val:
        console.log(irToString(op));
        console.log(ops[++i]);
        break;
      case IR.true_:
        console.log("TRUE");
        break;
      case IR.false_:
        console.log("FALSE");
        break;
      default:
        console.log(irToString(op));
    }
  }
}

module.exports = {
  printIR,
};