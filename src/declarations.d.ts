declare module "*.wasm" {
  const buffer: BufferSource;
  export default buffer;
}

declare module "randomfill" {
  export function randomFillSync<T>(buffer: T, offset: number, size: number): T;
}
