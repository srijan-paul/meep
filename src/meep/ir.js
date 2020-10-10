const IR = Object.freeze({
	pop_: 0,
	push_: 1,
	inc: 2,
	dec: 3,
	add: 4,
	sub: 5,
	equals: 6,
	set_var: 7,
	get_var: 8,
	inc_n: 9,
	false_: 10,
	true_: 11,
	val: 12,
});


function irToString(op) {
	switch(op) {
	case IR.pop_: return 'POP_';
	case IR.push_: return 'PUSH_';
	case IR.inc: return 'INC';
	case IR.dec: return 'DEC';
	case IR.add: return 'ADD';
	case IR.sub: return 'SUB';
	case IR.equals: return 'EQUALS';
	case IR.set_var: return 'SET_VAR';
	case IR.get_var: return 'GET_VAR';
	case IR.inc_n: return 'INC_N';
	case IR.false_: return 'FALSE_';
	case IR.true_: return 'TRUE_';
	case IR.val: return 'VAL';
	}
}
  module.exports = {IR, irToString};
