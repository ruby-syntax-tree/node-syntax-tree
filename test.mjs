import assert from "node:assert";
import test from "node:test";

import createSyntaxTree from "./dist/index.mjs";

const syntaxTree = await createSyntaxTree();

test("handlers.bf.parse", () => {
  assert.equal(
    syntaxTree.handlers.bf.parse("+++"),
    "(root (increment), (increment), (increment))\n"
  );
});

test("handlers.bf.format", () => {
  assert.equal(syntaxTree.handlers.bf.format("+++"), "+++\n");
});

test("handlers.css.parse", () => {
  const source = `
    .foo {
      color: red;
    }
  `;

  const expected = `(css-stylesheet
  (style-rule
    (selectors
      (class-selector (ident-token "foo"))
    )
    (declarations
      (declaration color (ident-token "red"), (semicolon-token))
    )
  )
)
`;

  assert.equal(syntaxTree.handlers.css.parse(source), expected);
});

// test("handlers.css.format", () => {
//   const source = ".foo{color:red;}";
//   const expected = `.foo {
//   color: red;
// }
// `;

//   assert.equal(syntaxTree.handlers.css.format(source), expected);
// });

test("handlers.json.parse", () => {
  assert.equal(
    syntaxTree.handlers.json.parse(`{ "a": "b" }`),
    `(root value=(object values={"\\"a\\""=>(string value="\\"b\\"")}))\n`
  );
});

test("handlers.json.format", () => {
  assert.equal(
    syntaxTree.handlers.json.format(`{"a":"b"}`),
    `{ "a": "b" }\n`
  );
});

test("handlers.haml.parse", () => {
  assert.equal(
    syntaxTree.handlers.haml.parse("= foo"),
    `(root children=[(script text=" foo")])\n`
  );
});

test("handlers.haml.format", () => {
  assert.equal(syntaxTree.handlers.haml.format("=  foo"), "= foo\n");
});

test("handlers.ruby.parse", () => {
  assert.equal(
    syntaxTree.handlers.ruby.parse("foo"),
    `(program (statements ((vcall (ident "foo")))))\n`
  );
});

test("handlers.ruby.format", () => {
  assert.equal(syntaxTree.handlers.ruby.format("1+1"), "1 + 1\n");
});

test("handlers.xml.parse", () => {
  assert.equal(
    syntaxTree.handlers.xml.parse("<foo></foo>"),
    `(document\n  (element (opening_tag "<", "foo", ">"), (closing_tag "</", "foo", ">"))\n)\n`
  );
});

test("handlers.xml.format", () => {
  assert.equal(syntaxTree.handlers.xml.format("<foo></foo>"), "<foo />\n");
});
