import assert from "node:assert";
import test from "node:test";

import createSyntaxTree from "./dist/index.mjs";

const syntaxTree = await createSyntaxTree();

test("handlers.haml.format", () => {
  assert.equal(syntaxTree.handlers.haml.format("=  foo"), "= foo\n");
});

test("handlers.haml.parse", () => {
  assert.equal(
    syntaxTree.handlers.haml.parse("= foo"),
    `(root children=[(script text=" foo")])\n`
  );
});

test("handlers.ruby.format", () => {
  assert.equal(syntaxTree.handlers.ruby.format("1+1"), "1 + 1\n");
});

test("handlers.ruby.parse", () => {
  assert.equal(
    syntaxTree.handlers.ruby.parse("foo"),
    `(program (statements ((vcall (ident "foo")))))\n`
  );
});
