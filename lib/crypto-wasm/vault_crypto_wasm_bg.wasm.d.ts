/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const decryptEntry: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
export const decryptRaw: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
export const deriveEncryptionKey: (a: number, b: number, c: number, d: number) => [number, number];
export const encryptEntry: (a: number, b: number, c: number, d: number) => [number, number, number];
export const encryptRaw: (a: number, b: number, c: number, d: number) => [number, number, number];
export const generateEncryptionSalt: () => [number, number, number, number];
export const generatePassword: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
export const generateSharedVaultKey: () => [number, number, number, number];
export const generateX25519Keypair: () => [number, number, number];
export const hashMasterPassword: (a: number, b: number) => [number, number, number];
export const verifyMasterPassword: (a: number, b: number, c: number, d: number) => [number, number, number];
export const x25519DeriveSharedKey: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const init: () => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
