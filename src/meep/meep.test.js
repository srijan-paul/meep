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
`;

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
`;

const test4 = `
    var a = 0;
    var b = 1;
    var c = 1;
    var temp = 0;
    var i = 5;

    while i != 0 {
        set temp = b;
        set b = b + a;
        set a = temp;
        set c = b;
        set i = i - 1;
    }

    print '0' + b;
`;

const test5 = `
    var s = "abcd\n";
    var s2 = {'a', 'b'};
    print s;
    print s;
`;

const test6 = `
    var a = {'a', 'b', 'c'};
    var i = 0;
    while (i != 3) {
        print a[i];
        set i = i + 1;
    }
`;

const test7 = `
    var v = 'd'; 
    var a = {'a', 'b', 'c'};
    var i = 2 - 1;
    set a[i] = v;
    print a[i];
`;

const test8 = `
    var memory = bus 3;
    set memory[2] = 'a';
    print memory[2]; 
`;

const test9 = `
    var a = input;
    var b = input - '0';
    var c = a + b;
    print c;
`;

const test10 = `
    var memory = bus 250;
    var mptr = 0;
    var len = 100;
    var code = ">+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.<";

    var i = 0;
    var c;
    while (i != len) {
        set c = code[i];
        if (c == '>')      set mptr = mptr + 1;
        else if (c == '<') set mptr = mptr - 1;
        else if (c == '+') set memory[mptr] = memory[mptr] + 1;
        else if (c == '.') print memory[mptr];
        else if (c == ',') memory[mptr] = input;
        else if (c == '[') {
            if (memory[mptr] != 0) {
                
            } 
        } else if c == ']' {

        }
        set i = i + 1;
    }
`;

const test11 = `
    var memory = bus 100;
    var mptr = 0;
    var len = 51;
    var code = "some code here";

    var i = 0;
    var c;
    while (i != len) {
        print code[i];
        set i = i + 1;
    }
`;

const code = test10;

const tokens = tokenize(code);
console.log(tokens.map((t) => t.raw));

const compiler = new IRCompiler(tokens);
const ir = compiler.compile();
printIR(ir);

const gen = new CodeGen(ir);
console.log(gen.generate());
