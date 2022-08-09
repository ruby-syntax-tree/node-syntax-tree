# node-syntax-tree

`node-syntax-tree` is a node package for executing Syntax Tree in a WASM environment. It functions by compiling the Ruby interpreter and Syntax Tree source files into a WASM package that is loaded and executed at runtime.

## Getting started

If you're using the `npm`:

```bash
npm install --save node-syntax-tree
```

Or if you're using `yarn`, then add the plugin by:

```bash
yarn add node-syntax-tree
```

## Usage

`node-syntax-tree` provides both CJS and ESM modules distributions. To require through CJS, run:

```js
const { default: createSyntaxTree } = require("node-syntax-tree");
```

To require through ESM, run:

```js
import createSyntaxTree from "node-syntax-tree";
```

Once you have the import, you can initial the virtual machine and run the associated functions, as in:

```js
createSyntaxTree().then((syntaxTree) => {
  console.log(syntaxTree.handlers.ruby.parse("foo"));
  // => (program (statements ((vcall (ident "foo")))))

  console.log(syntaxTree.handlers.ruby.format("1+1"));
  // => 1 + 1

  console.log(syntaxTree.handlers.haml.parse("= foo"));
  // => (root children=[(script text=" foo")])

  console.log(syntaxTree.handlers.haml.format("=  foo"));
  // => = foo
});
```

TypeScript types are provided along with this package, and effectively boil down to:

```js
type SyntaxTreeHandler = {
    format(source: string): string;
    parse(source: string): string;
    read(filepath: string): string;
};

type SyntaxTree = {
  handlers: Record<"haml" | "ruby", SyntaxTreeHandler>
};

function createSyntaxTree(): Promise<SyntaxTree>;
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/ruby-syntax-tree/node-syntax-tree.

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).


import { RubyVM } from "ruby-head-wasm-wasi/dist/index";
declare type SyntaxTreeHandler = {
    format(source: string): string;
    parse(source: string): string;
    read(filepath: string): string;
};
export declare type SyntaxTree = {
    rubyVM: RubyVM;
    handlers: Record<"haml" | "ruby", SyntaxTreeHandler>;
};
export default function createSyntaxTree(): Promise<SyntaxTree>;
export {};


test("handlers.haml.parse", () => {
  assert.equal(
    syntaxTree.handlers.haml.parse("= foo"),
    `(root children=[(script text=" foo")])\n`
  );
});