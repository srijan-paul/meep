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
	load_byte: 12,
	print: 13,
	start_if: 14,
	close_if_body: 15,
	end_if: 16,
	start_else: 17,
	end_else: 18,
	start_loop: 19,
	end_loop: 20,
	popn: 21,
	cmp_less: 22,
	cmp_greater: 23,
	load_string: 24,
	make_bus: 25,
	index_var: 26,
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
	case IR.load_byte: return 'LOAD_BYTE';
	case IR.print: return 'PRINT';
	case IR.start_if: return 'START_IF';
	case IR.close_if_body: return 'CLOSE_IF_BODY';
	case IR.end_if: return 'END_IF';
	case IR.start_else: return 'START_ELSE';
	case IR.end_else: return 'END_ELSE';
	case IR.start_loop: return 'START_LOOP';
	case IR.end_loop: return 'END_LOOP';
	case IR.popn: return 'POPN';
	case IR.cmp_less: return 'CMP_LESS';
	case IR.cmp_greater: return 'CMP_GREATER';
	case IR.load_string: return 'LOAD_STRING';
	case IR.make_bus: return 'MAKE_BUS';
	case IR.index_var: return 'INDEX_VAR';
	}
}
  module.exports = {IR, irToString};
