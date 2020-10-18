# Meep

A programming language that compiles to brainfuck.
Made for the sole purpose of writing a brainfuck interpreter
in meep and then compiling the interpreter to have a brainfuck 
interpreter written in brainfuck. 

## Installation

Very simple, just `git clone` this repository.

## Usage

```
node . path/to/meep_file path/to/output
```

## Example:

This command for example, compiles a single file in the test suite: 

```
node . test/3.meep hello_world.bf
```

It will generate a a file called `hello_world.bf` in the root directory of the project.
Note that you will still need a brainfuck interpreter for running the code that the meep
compiler produces. I personally use [this one](https://copy.sh/brainfuck/).

## Features

* Variable declaration and assignment: 

```js
var str = "Hello world !";
print str; // Hello world !
var letter = 'c';
print letter; // c
set letter = 'b'
print letter; // b
```

The print statement prints a single byte or a stream of bytes (strings or buses/arrays)
by interpreting each byte as an ascii character.

* Looping and conditionals

```js
var array = {1, 2, 3 4}

var i = 0;
while i < len(array) {
    print '0' + array[i]; // add '0' to print the ascii char of that digit
    set i = i + 1;
}

var sayHello = false;

if sayHello print "Hello"
else print "Bye"
```

* Binary operators:

Meep was a language written to only write a brainfuck interpreter
in the end so the only operators supported are the ones I would need
for that task. These are:

```js
+ - != ==
```

Yeah, that's it. When working with unsigned integers, it is quite 
easy to use just these 4 as `||` and `&&` so I didn't bother implementing 
those.

## The Bf Interpreter

The Meep source code for the brainfuck interpreter can be found in `test\bfinterpreter.meep`
and the compiled brainfuck-in-brainfuck interpreter is at the root directory, in `interpreter.bf`.
