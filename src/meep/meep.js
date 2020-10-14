// This is the interpreter for the TF (The fuck ?) programming language.
// The-fuck? isn't meant to be usable as a proper language by any means,
// since we only need this as an intermediate to compile to brainfuck,
// I'll keep it simple.

// T-f has:
// variable declaration
// two arithmetic operators + -
// if-statements
// while-loops
// numbers and characters

// Tokenizer

// since javascript doesn't have ennums and
// we want this to be done quick and dirty...

const TType = Object.freeze({
  var: 1,
  _if: 2,
  _while: 3,
  _else: 4,
  plus: 5,
  minus: 6,
  less: 7,
  greater: 8,
  eq: 9,
  eqeq: 10,
  id: 11,
  number: 12,
  char: 13,
  plusplus: 14,
  minusminus: 14,
  _true: 15,
  _false: 16,
  print: 17,
  scan: 18,
  semi: 20,
  lparen: 21,
  rparen: 22,
  lbrace: 23,
  rbrace: 24,
  lbrac: 25,
  rbrac: 26,
  string: 27,
  comma: 28,
  set: 29,
});

function isAlpha(c) {
  let ascii = c.charCodeAt(0);
  return (ascii >= 97 && ascii <= 122) || (ascii >= 65 && ascii <= 90);
}

function isDigit(c) {
  let ascii = c.charCodeAt(0);
  return ascii >= 48 && ascii <= 57;
}

const tfKeywords = new Map([
  ["var", TType.var],
  ["if", TType._if],
  ["while", TType._while],
  ["else", TType._else],
  ["true", TType._true],
  ["false", TType._false],
  ["print", TType.print],
  ["set", TType.set],
]);

function tfTokenize(source) {
  let current = 0;
  let start = 0;
  const tokens = [];

  function pushToken(type) {
    tokens.push({ raw: source.substring(start, current), type });
  }

  function eof() {
    return current >= source.length;
  }

  function expect(c) {
    if (eof() || source[current++] != c) throw new Error(`Expected  '${c}'.`);
  }

  function pushIf(char, then, _else) {
    if (source[current] == char) {
      current++;
      pushToken(then);
    } else {
      pushToken(_else);
    }
  }

  while (current < source.length) {
    start = current;
    let char = source[current++];
    // skip whitespace
    if (char == " " || char == "\n" || char == "\t" || char == "\r") continue;

    switch (char) {
      case "+":
        pushIf("+", TType.plusplus, TType.plus);
        break;
      case "-":
        pushToken(TType.minus);
        break;
      case "=":
        pushIf("=", TType.eqeq, TType.eq);
        break;
      case "<":
        pushToken(TType.less);
        break;
      case ">":
        pushToken(TType.greater);
        break;
      case ";":
        pushToken(TType.semi);
        break;
      case "(":
        pushToken(TType.lparen);
        break;
      case ")":
        pushToken(TType.rparen);
        break;
      case "{":
        pushToken(TType.lbrace);
        break;
      case "}":
        pushToken(TType.rbrace);
        break;
      case ",":
        pushToken(TType.comma);
        break;
      case "'":
        if (eof()) throw new Error("Unterminated character literal.");
        if (source[current++] == "'")
          throw new Error("Empty character literal.");
        expect("'");
        pushToken(TType.char);
        break;
      case '"':
        while (!eof() && source[current] != '"') current++;
        if (eof()) throw new Error("Unterminated string literal.");
        current++; // eat the '"'
        pushToken(TType.string);
        break;
      default:
        if (isAlpha(char)) {
          // keyword / identifier
          while (
            !eof() &&
            (isAlpha(source[current]) || isDigit(source[current]))
          )
            current++;
          let str = source.substring(start, current);
          let type = TType.id;
          if (tfKeywords.has(str)) type = tfKeywords.get(str);
          pushToken(type);
        } else if (isDigit(char)) {
          // number literal.
          while (!eof() && isDigit(source[current])) current++;
          pushToken(TType.number);
        } else {
          throw new Error("Unexpected character " + char);
        }
    }
  }

  return tokens;
}

// Intermediate Representation

// I'm being lazy here by generating the IR code
// via a python script in "../../scripts/irgen.py"

const { IR } = require("./ir");

//  Compiler / Parser
//  recursive descent parser.

class IRCompiler {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
    this.ir = [];
    this.symbols = []; // symbol table
    this.scopeDepth = 0;
  }

  // helper methods

  next() {
    return this.tokens[this.current++];
  }

  eof() {
    return this.current >= this.tokens.length;
  }

  lookAhead(count) {
    if (!count) return this.tokens[this.current];
    if (this.current + this.count >= this.tokens.length) return null;
    return this.tokens[this.current + this.count];
  }

  checkToken(type) {
    return this.lookAhead() && this.lookAhead().type == type;
  }

  isToken(t, type) {
    return t.type == type;
  }

  matchToken(...types) {
    for (let type of types) {
      if (this.checkToken(type)) {
        this.next();
        return true;
      }
    }

    return false;
  }

  expect(type, errorMessage) {
    if (!this.checkToken(type)) {
      throw new Error(errorMessage);
    }
    return this.next();
  }

  prev() {
    return this.tokens[this.current - 1];
  }

  emit(...opcodes) {
    opcodes.forEach((op) => this.ir.push(op));
  }

  addSymbol(name) {
    if (this.symbols.includes(name)) {
      throw new Error(`Attempt to redeclare variable ${name}`);
    }
    this.symbols.push(name);
  }

  pushScope() {
    this.scopeDepth++;
  }

  popScope() {
    this.scopeDepth--;
  }

  getVar(name) {
    const index = this.symbols.indexOf(name);
    if (index == -1) {
      throw new Error(`Undefined global variable '${name}'.`);
    }
    return this.symbols.indexOf(name);
  }

  // recursive descent parsing

  compile() {
    while (!this.eof()) {
      this.statement();
    }
    return this.ir;
  }

  statement() {
    if (this.matchToken(TType.var)) {
      this.varDecl();
    } else if (this.matchToken(TType.print)) {
      this.printStmt();
    } else if (this.matchToken(TType.set)) {
      this.setStmt();
    } else if (this.matchToken(TType._if)) {
      this.ifStmt();
    } else if (this.matchToken(TType.lbrace)) {
      this.block();
    } else if (this.matchToken(TType._while)) {
      this.whileStmt();
    } else {
      // expression statements
      this.expression();
      this.emit(IR.pop_);
    }

    this.matchToken(TType.semi);
  }

  varDecl() {
    if (this.scopeDepth != 0) {
      throw new Error(
        "All variables must be declared globally in the top level scope."
      );
    }

    const name = this.expect(TType.id);
    this.addSymbol(name.raw);

    if (this.matchToken(TType.eq)) {
      this.expression();
    } else {
      this.emit(0);
    }
  }

  setStmt() {
    let setOp = IR.set_var;
    const varname = this.expect(TType.id);
    const localIndex = this.getVar(varname.raw);

    if (this.matchToken(TType.lbrac)) {
      setOp = IR.mutate_bus;
      this.expression();
      this.expect(TType.rbrac);
    }

    this.expect(TType.eq, "Expected '='");
    this.expression();

    this.emit(setOp, localIndex);
  }

  printStmt() {
    this.expression();
    this.emit(IR.print);
  }

  ifStmt() {
    this.expression();
    this.emit(IR.start_if);
    this.statement();
    this.emit(IR.close_if_body);

    if (this.matchToken(TType._else)) {
      this.emit(IR.start_else);
      this.statement();
      this.emit(IR.end_else);
    }

    this.emit(IR.end_if);
  }

  block() {
    this.pushScope();
    while (!(this.eof() || this.matchToken(TType.rbrace))) {
      this.statement();
    }
    this.popScope();
  }

  whileStmt() {
    this.expression(); // compile condition.
    this.emit(IR.start_loop);
    this.statement();
    this.emit(IR.end_loop);
  }

  expression() {
    this.equality();
  }

  equality() {
    this.comparison();
    while (this.matchToken(TType.eqeq)) {
      this.comparison();
      this.emit(IR.equals);
    }
  }

  comparison() {
    this.add();
    while (this.matchToken(TType.less, TType.greater)) {
      let op = this.prev().type == TType.less ? IR.cmp_less : IR.cmp_greater;
      this.add();
      this.emit(op);
    }
  }

  add() {
    this.grouping();
    while (this.matchToken(TType.plus, TType.minus)) {
      let op = this.prev().type == TType.plus ? IR.add : IR.sub;
      this.grouping();
      this.emit(op);
    }
  }

  grouping() {
    if (this.matchToken(TType.lparen)) {
      this.expression();
      this.expect(TType.rparen, "Expected ')'.");
      return;
    }

    this.literal();
  }

  literal() {
    const token = this.next();

    if (token.type == TType.number) {
      let n = parseInt(token.raw);
      this.emit(IR.load_byte, n);
    } else if (token.type == TType._false) {
      this.emit(IR.false_);
    } else if (token.type == TType._true) {
      this.emit(IR.true_);
    } else if (token.type == TType.char) {
      this.emit(IR.load_byte, token.raw.charCodeAt(1));
    } else if (token.type == TType.id) {
      let slot = this.getVar(token.raw);

      if (slot == -1) {
        throw new Error("Unable to find variable " + token.raw);
      }

      this.emit(IR.get_var, slot);
    } else if (token.type == TType.string) {
      this.emit(IR.load_string, token.raw.substring(1, token.raw.length - 1));
    } else if (token.type == TType.lbrace) {
      this.busLiteral();
    } else {
      throw new Error(`CompileError: Unexpected '${token.raw}' token.`);
    }
  }

  // a bus is simply a stream of byes.
  // var mybus  = {1, 2, "Abc"} will reduce down the mybus variable
  // to an aggregate of 6 bytes, as if it were an array like [1, 2, 3, 'a', 'b', 'c']
  busLiteral() {
    let length = 0;
    while (!(this.eof() || this.matchToken(TType.rbrace))) {
      this.expression();
      length++;
      this.matchToken(TType.comma);
    }
    this.emit(IR.make_bus, length);
  }
}

module.exports = {
  tokenize: tfTokenize,
  IRCompiler: IRCompiler,
};
