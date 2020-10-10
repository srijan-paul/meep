const { tokenize, IRCompiler } = require("./meep");
const { printIR } = require("./debug");
const CodeGen = require("./codegen");

const code = `
if 1 print 1 else print 2;
`;

const tokens = tokenize(code);
console.log(tokens.map((t) => t.value));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
