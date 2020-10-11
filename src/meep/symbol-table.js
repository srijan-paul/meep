class SymbolTable {
  constructor() {
    this.symbols = [];
    // this is an array of numbers
    // each index in the array denotes
    // how many local variables that scope 
    // contains.
    // whenever we enter a new scope, a 0 is 
    // pushed to this.
    // And whenever we declare a new variable in a scope
    // a 1 is added to the last element in this array.
    this.scopes = [0];
  }

  // add a symbol to the symbol table
  add(name) {
    this.symbols.push(name);
    ++this.scopes[this.scopes.length - 1];
  }

  /**
   * Find a variable in the scope chains, return it's depth (measured from bottom)
   * @param {string} name The name of the variable
   * @returns {number} height of the variable from the bottom of the stack. 
   */
  find(name) {
    for (let i = this.symbols.length; i >= 0; i--) {
      if (this.symbols[i] == name) {
        return i;
      }
    }
    return -1;
  }

  // pops off all the local variables
  // from the table in the innermost scope, returns the number 
  // of local variables popped.
  popScope() {
    let localCount = this.scopes[this.scopes.length - 1];
    
    for (let i = 0; i < localCount; i++) {
      this.symbols.pop();
    }

    this.scopes.pop();
    return localCount;
  }

  pushScope() {
    this.scopes.push(0);
  }
}

module.exports = SymbolTable;
