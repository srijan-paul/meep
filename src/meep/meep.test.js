const { tokenize, IRCompiler } = require("./meep");
const { printIR } = require("./debug");
const CodeGen = require("./codegen");

let test1 = `
    var endmsg = "\nprogram ended successfully";
    var a = 1;
    var str1 = {'a', "==" ,'b'};
    var b = 1;
    var str2 = "a != b";

    if a == b {
        print str1;
    } else {
        print str2;
    }

    print endmsg;
`;

const code = test1;

const tokens = tokenize(code);
console.log(tokens.map((t) => t.raw));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
