const {tokenize, IRCompiler} = require('./meep');
const {printIR} = require('./debug');
const CodeGen = require('./codegen');

const code =
`
val a = 25;
val b = 2;
val isFalse = false;
`

const tokens = tokenize(code);
console.log(tokens.map(t => t.value));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
