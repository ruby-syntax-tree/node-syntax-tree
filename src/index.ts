import { WASI } from "@wasmer/wasi";
import { WasmFs } from "@wasmer/wasmfs";
import { RubyVM } from "ruby-head-wasm-wasi/dist/index";

import { randomFillSync } from "randomfill";
import path from "path-browserify";

import app from "./app.wasm";

type AppExports = {
  _initialize: () => void;
  memory: WebAssembly.Memory;
};

// This overwrites the default writeSync function used by the WasmFs to instead
// pipe it out to the console.
function createWriter(originalWriter: Function) {
  return function () {
    let text: string;

    if (arguments.length === 4) {
      text = arguments[1];
    } else {
      text = new TextDecoder("utf-8").decode(arguments[1]);
    }

    switch (arguments[0]) {
      case 1:
        console.log(text);
        break;
      case 2:
        console.warn(text);
        break;
    }

    return originalWriter.call(arguments);
  }
}

type SyntaxTreeHandler = {
  format(source: string): string;
  parse(source: string): string;
  read(filepath: string): string;
};

export type SyntaxTree = {
  rubyVM: RubyVM;
  handlers: Record<"bf" | "css" | "haml" | "json" | "ruby" | "xml", SyntaxTreeHandler>;
};

export default async function createSyntaxTree(): Promise<SyntaxTree> {
  // First, create a new file system that we can use internally within the Ruby
  // WASM VM.
  const wasmFs = new WasmFs();
  wasmFs.fs.mkdirSync("/tmp", 0o777);
  wasmFs.fs.writeSync = createWriter(wasmFs.fs.writeSync.bind(wasmFs.fs));

  // Next, create a new WASI instance with the correct options overridden from
  // the defaults.
  const wasi = new WASI({
    bindings: { ...WASI.defaultBindings, fs: wasmFs.fs, path, randomFillSync },
    preopens: { "/": "/tmp" }
  });

  // Then, create a new Ruby VM instance that we can use to store the memory for
  // our application.
  const rubyVM = new RubyVM();
  const imports = { wasi_snapshot_preview1: wasi.wasiImport };
  rubyVM.addToImports(imports);

  // Set the WASI memory to use the memory for our application.
  const instance = await WebAssembly.instantiate(app, imports).then((result) => {
    return result.instance as WebAssembly.Instance & { exports: AppExports };
  });

  // Make sure WASI and our web assembly instance share their memory.
  wasi.setMemory(instance.exports.memory);

  // Load our application into the virtual machine.
  instance.exports._initialize();
  await rubyVM.setInstance(instance);

  // Initial our virtual machine and return it. It should now be able to
  // evaluate and execute Ruby code.
  rubyVM.initialize();

  // Once our virtual machine is booted, we're going to require the necessary
  // files to make it work. I'm not sure why I need to explicitly require
  // did_you_mean here, but it doesn't work without it.
  rubyVM.eval(`
    require "did_you_mean"
    require "json"

    $:.unshift("/lib")
    require_relative "/lib/syntax_tree"
    require_relative "/lib/syntax_tree/bf"
    require_relative "/lib/syntax_tree/css"
    require_relative "/lib/syntax_tree/haml"
    require_relative "/lib/syntax_tree/json"
    # require_relative "/lib/syntax_tree/rbs"
    require_relative "/lib/syntax_tree/xml"
  `);

  return {
    rubyVM,
    handlers: {
      bf: makeSyntaxTreeHandler(".bf"),
      css: makeSyntaxTreeHandler(".css"),
      haml: makeSyntaxTreeHandler(".haml"),
      json: makeSyntaxTreeHandler(".json"),
      ruby: makeSyntaxTreeHandler(".rb"),
      // rbs: makeSyntaxTreeHandler(".rbs"),
      xml: makeSyntaxTreeHandler(".xml")
    }
  };

  function makeSyntaxTreeHandler(extension: string): SyntaxTreeHandler {
    return {
      format(source) {
        const jsonSource = JSON.stringify(JSON.stringify(source));
        const rubySource = `
          handler = SyntaxTree::HANDLERS["${extension}"]
          handler.format(JSON.parse(${jsonSource}))
        `;

        return rubyVM.eval(rubySource).toString();
      },
      parse(source) {
        const jsonSource = JSON.stringify(JSON.stringify(source));
        const rubySource = `
          handler = SyntaxTree::HANDLERS["${extension}"]
          node = handler.parse(JSON.parse(${jsonSource}))
          PP.pp(node, +"", 80)
        `;

        return rubyVM.eval(rubySource).toString();
      },
      read(filepath) {
        const jsonSource = JSON.stringify(JSON.stringify(filepath));
        const rubySource = `
          handler = SyntaxTree::HANDLERS["${extension}"]
          handler.read(JSON.parse(${jsonSource}))
        `;

        return rubyVM.eval(rubySource).toString();
      }
    };
  }
};
