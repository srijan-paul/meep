const { tokenize, IRCompiler } = require("./src/meep");
const CodeGen = require("./src/codegen");
const fs = require("fs");

if (process.argv.length != 0) {
  console.log(`usage: meep path/to/file.meep path/to/output.bf`);
} else {
  const fPath = process.argv[0];
  const destPath = process.argv[1];
  fs.readFile(fPath, (err, data) => {
    if (err) throw err;
    else toBf(destPath, data);
  });
}

function toBf(fileName, code) {
  const tokens = tokenize(code);
  const compiler = new IRCompiler(tokens);
  const ir = compiler.compile();
  const gen = new CodeGen(ir);
  const bf = gen.generate();

  fs.writeFile(fileName, bf, (err) => {
    if (err) throw new Error("error while creating output file.");
  });
}
