class Scope {
  constructor() {
    this.locals = new Map();
  }

  setLocal(key, value) {
    this.locals.set(key, value);
  }

  getLocal(key) {
    return this.locals.get(key);
  }

  hasLocal(key) {
    return this.locals.has(key);
  }
}

class SymbolTable {
  constructor() {
    this.scopeChain = [];
  }

  find(name) {
    for (let i = this.scopeChain.length; i >= 0; i--) {
      let scope = this.scopeChain[i];
      if (scope.has(name)) {
        return scope.get(name);
      }
    }

    return null;
  }

  pushScope() {
    this.scopeChain.push(new Scope());
  }

  popScope() {
    this.scopeChain.pop();
  }

  set(name, value) {
    this.scopeChain[this.scopeChain.length - 1].setLocal(name, value);
  }
}

module.exports = SymbolTable;
