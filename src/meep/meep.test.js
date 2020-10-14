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


const test2 = `
    var s1 = "abcd";
    print s1;
    var a = 1;
    set s1 = "wxyz";
    print s1;
`

const test3 = `
    var i = 9;
    if i != 0 {
        print '0' + i;
        set i = i - 1;
        if i != 4 {
            print '0' + i;
            set i = i - 1;
            if i != 9 {
                print '0' + i;
                if i != 7 {
                    print 'a';
                }
            }
        }
    }
`

const test4 = `
    var i = 1;
    while i != 0 {
        print 'a';
        set i = i - 1;
    }
`

const code = test4;

const tokens = tokenize(code);
console.log(tokens.map((t) => t.raw));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
