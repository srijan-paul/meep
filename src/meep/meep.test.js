const { tokenize, IRCompiler } = require("./meep");
const { printIR } = require("./debug");
const CodeGen = require("./codegen");

const code = `
 if 1 == 2 print 'a';
 else if 2 == 3 print 'b';
 else print 'c';
`;

const tokens = tokenize(code);
console.log(tokens.map((t) => t.value));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
