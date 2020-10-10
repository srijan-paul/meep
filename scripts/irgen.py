# This is a helper script to automatically generate code
# since Javascript doesn't have enums and using objects as \
# enums is painful.

import re

IR = """
  pop_ push_ inc dec
  add sub equals
  set_var get_var
  inc_n false_ true_
  val
"""

opcodes = re.findall(r"\w+", IR)

irFile = open('../src/meep/ir.js', 'w')

out = "const IR = Object.freeze({\n"

k = 0
for op in opcodes:
    out += f"\t{op}: {k},\n"
    k += 1

out += "});\n\n"

out += """
function irToString(op) {
\tswitch(op) {
"""

for op in opcodes:
    out += f"\tcase IR.{op}: return '{op.upper()}';\n"

out += "\t}\n}"

out += """
  module.exports = {IR, irToString};
"""

irFile.write(out)
