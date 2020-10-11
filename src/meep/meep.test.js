const { tokenize, IRCompiler } = require("./meep");
const { printIR } = require("./debug");
const CodeGen = require("./codegen");

const code = `
   var a = 1;
   var eq = "a==b";
   var b = 1;
   var neq = "a!=b";
   if a == b {
       print eq;
   } else {
       print neq;
   }
`;

const tokens = tokenize(code);
console.log(tokens.map((t) => t.raw));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
