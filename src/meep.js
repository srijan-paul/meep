// Front end for the meep programming language

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
  bang: 30,
  bangeq: 31,
  bus: 32,
  input: 33,
  len: 34,
});

function isAlpha(c) {
  let ascii = c.charCodeAt(0);
  return (ascii >= 97 && ascii <= 122) || (ascii >= 65 && ascii <= 90);
}

function isDigit(c) {
  let ascii = c.charCodeAt(0);
  return ascii >= 48 && ascii <= 57;
}

const Keywords = new Map([
  ["var", TType.var],
  ["if", TType._if],
  ["while", TType._while],
  ["else", TType._else],
  ["true", TType._true],
  ["false", TType._false],
  ["print", TType.print],
  ["set", TType.set],
  ["bus", TType.bus],
  ["input", TType.input],
  ["len", TType.len],
]);

function tokenize(source) {
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
      case "[":
        pushToken(TType.lbrac);
        break;
      case "]":
        pushToken(TType.rbrac);
        break;
      case ",":
        pushToken(TType.comma);
        break;
      case "/":
        expect("/");
        while (!eof() && source[current++] != "\n");
        break;
      case "'":
        if (eof()) throw new Error("Unterminated character literal.");
        if (source[current++] == "'")
          throw new Error("Empty character literal.");
        expect("'");
        pushToken(TType.char);
        break;
      case "!":
        pushIf("=", TType.bangeq, TType.bang);
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
          if (Keywords.has(str)) type = Keywords.get(str);
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

    const name = this.expect(
      TType.id,
      "Expected variable name, got " + this.lookAhead().raw
    );
    this.addSymbol(name.raw);

    if (this.matchToken(TType.eq)) {
      this.expression();
    } else {
      this.emit(IR.load_byte, 0);
    }
  }

  setStmt() {
    const varname = this.expect(TType.id, "Expected variable name.");
    const localIndex = this.getVar(varname.raw);

    if (localIndex == -1) {
      throw new Error("undefined variable ", varname.raw);
    }

    if (this.matchToken(TType.lbrac)) {
      const beforeExp = this.ir.length;
      this.expression(); // index
      const afterExp = this.ir.length;
      const indexInstructions = this.ir.splice(beforeExp, afterExp - beforeExp);
      this.expect(TType.rbrac, "Expected ']'");
      this.expect(TType.eq, "Expected '='");
      this.expression(); // value
      this.ir.push(...indexInstructions);
      this.emit(IR.set_at_index, localIndex);
      return;
    }

    this.expect(TType.eq, "Expected '='");
    this.expression();

    this.emit(IR.set_var, localIndex);
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
    // hacky.
    let before = this.ir.length - 1;
    this.expression(); // compile condition.
    let after = this.ir.length;
    this.emit(IR.start_loop);
    this.statement();
    // emit the bytes for the condition again
    // since it needs to be reevaluated.
    for (let i = before + 1; i < after; i++) {
      this.emit(this.ir[i]);
    }
    this.emit(IR.end_loop);
  }

  inputStmt() {}

  expression() {
    this.equality();
  }

  equality() {
    this.comparison();
    while (this.matchToken(TType.eqeq, TType.bangeq)) {
      let neq = this.prev().type == TType.bangeq;
      this.comparison();
      this.emit(IR.equals);
      // first check for equality, then not it. It's more like !(a==b)
      // but efficiency isn't the goal in this toy project soooo....
      if (neq) {
        this.emit(IR.not);
      }
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

  preUnary() {
    if (this.matchToken(TType.bang)) {
      this.grouping();
      this.emit(IR.not);
      return;
    }

    this.grouping();
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
      // index expression (a[123]) or identifier.
      // precedence for [] in meep is different
      // from other languages, it's the highest binding infix, and
      // is only allowed right after identifiers.
      const slot = this.getVar(token.raw);

      if (slot == -1) {
        throw new Error("Undefined variable " + token.raw);
      }

      let op = IR.get_var;

      if (this.matchToken(TType.lbrac)) {
        this.expression();
        op = IR.index_var;
        this.expect(TType.rbrac, "Expected ']'");
      }

      this.emit(op, slot);
    } else if (token.type == TType.string) {
      this.emit(IR.load_string, token.raw.substring(1, token.raw.length - 1));
    } else if (token.type == TType.lbrace) {
      this.busLiteral();
    } else if (token.type == TType.bus) {
      const size = parseInt(
        this.expect(TType.number, "Expected a number literal as bus size.").raw
      );
      this.emit(IR.make_sized_bus, size + 3); // 3 extra for padding
    } else if (token.type == TType.input) {
      this.emit(IR.input);
    } else if (token.type == TType.len) {
      let eatParen = false;
      if (this.matchToken(TType.lparen)) eatParen = true;

      const name = this.expect(TType.id, "Expected variable name.").raw;
      const slot = this.getVar(name);

      if (slot == -1) throw new Error("undefined variable " + name);
      if (eatParen) this.expect(TType.rparen, "Expected ')'");

      this.emit(IR.len, slot);
    } else {
      throw new Error(`CompileError: Unexpected '${token.raw}' token.`);
    }
  }

  // a bus is simply a stream of byes.
  // var mybus  = {1, 2, "Abc"} will reduce down the mybus variable
  // to an aggregate of 6 bytes, as if it were an array like [1, 2, 3, 'a', 'b', 'c']
  busLiteral() {
    let length = 3; // initally just assume the bus is as big as it's padding.
    this.emit(IR.false_, IR.false_); // 2 bytes of padding prior
    while (!(this.eof() || this.matchToken(TType.rbrace))) {
      this.atom();
      length++;
      this.matchToken(TType.comma);
    }
    this.emit(IR.false_); // 1 byte padding at the end.
    this.emit(IR.make_bus, length);
    console.log("length of the bus is: ", length);
    // the bus in memory looks like 0 0 member-1 member-2... member-3 0
  }

  atom() {
    if (this.checkToken(TType.number)) {
      let n = parseInt(this.next().raw);
      this.emit(IR.load_byte, n);
    } else if (this.checkToken(TType.char)) {
      this.emit(IR.load_byte, this.next().raw.charCodeAt(1));
    } else if (this.checkToken(TType.id)) {
      const name = this.next();
      const slot = this.getVar(name.raw);

      if (slot == -1) {
        throw new Error(`Undefined variable ${name.raw}`);
      }
      this.emit(IR.get_var, slot);
    } else if (this.matchToken(TType.len)) {
      let eatParen = false;
      if (this.matchToken(TType.lparen)) eatParen = true;

      const name = this.expect(TType.id, "Expected variable name.").raw;
      const slot = this.getVar(name);

      if (slot == -1) throw new Error("undefined variable " + name);
      if (eatParen) this.expect(TType.rparen, "Expected ')'");

      this.emit(IR.len, slot);
    } else if (this.matchToken(TType._false)) {
      this.emit(IR.false_);
    } else if (this.matchToken(TType._true)) {
      this.emit(IR.true_);
    } else if (this.matchToken(TType.input)) {
      this.emit(IR.input);
    } else {
      throw new Error(
        "Bus literal can only contain numbers, or character constants."
      );
    }
  }
}

module.exports = {
  tokenize: tokenize,
  IRCompiler: IRCompiler,
};
