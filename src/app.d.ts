declare module "*.wasm" {
  type Exports = {
    _initialize: () => void;
    memory: WebAssembly.Memory;
  };

  type Instance = WebAssembly.Instance & { exports: Exports };
  export default function load(imports: any): Promise<Instance>;
}
