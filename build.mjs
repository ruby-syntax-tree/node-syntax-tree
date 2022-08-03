import { execSync } from "child_process";
import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  bundle: true,
  entryPoints: [path.join(dirname, "src/index.ts")],
  minify: false,
  outdir: path.join(dirname, "dist"),
  platform: "node",
  plugins: [{
    name: "wasm",
    setup(build) {
      build.onLoad({ filter: /\.wasm$/ }, async (args) => ({
        contents: await fs.readFile(args.path),
        loader: "binary"
      }));
    }
  }],
  sourcemap: false,
  target: "es6"
};

Promise.all([
  esbuild.build({
    ...options,
    format: "esm",
    outExtension: { ".js": ".mjs" },
    banner: {
      js: `import { createRequire } from "module"; const require = createRequire(import.meta.url);`,
    }
  }),
  esbuild.build({
    ...options,
    format: "cjs",
    outExtension: { ".js": ".cjs" }
  })
]).then(([esm, cjs]) => {
  // When we're done building the output, we'll want to additionally build the
  // typescript declarations file.
  if (esm.errors.length + cjs.errors.length === 0) {
    execSync("./node_modules/.bin/tsc");
  }
});
