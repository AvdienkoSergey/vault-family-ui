/* tslint:disable */
/* eslint-disable */

/**
 * Расшифровка записи (AES-256-GCM → JSON).
 * Возвращает JSON-строку { service_name, service_url, login, password, notes }
 *
 * Промежуточные буферы зануляются (zeroize).
 * Совместимо с серверным `RealCrypto::decrypt_entry`.
 */
export function decryptEntry(encrypted_data_hex: string, nonce_hex: string, key_hex: string): string;

/**
 * Расшифровка сырых данных (AES-256-GCM → hex).
 * Возвращает plaintext как hex.
 *
 * Совместимо с серверным `RealCrypto::decrypt_raw`.
 */
export function decryptRaw(ciphertext_hex: string, nonce_hex: string, key_hex: string): string;

/**
 * Деривация ключа шифрования из мастер-пароля + encryption_salt.
 * Возвращает hex-encoded 32-байтный ключ.
 * PBKDF2-HMAC-SHA256, 600 000 итераций.
 *
 * Совместимо с серверным `RealCrypto::derive_encryption_key`.
 */
export function deriveEncryptionKey(password: string, salt: string): string;

/**
 * Шифрование записи (JSON → AES-256-GCM).
 * entry_json: JSON-строка { service_name, service_url, login, password, notes }
 * key_hex: 32-байтный ключ шифрования (hex)
 * Возвращает { encrypted_data: hex, nonce: hex }
 *
 * Совместимо с серверным `RealCrypto::encrypt_entry`.
 */
export function encryptEntry(entry_json: string, key_hex: string): any;

/**
 * Шифрование сырых данных (hex → AES-256-GCM).
 * plaintext_hex: данные для шифрования (hex)
 * key_hex: 32-байтный ключ (hex)
 * Возвращает { encrypted_data: hex, nonce: hex }
 *
 * Совместимо с серверным `RealCrypto::encrypt_raw`.
 */
export function encryptRaw(plaintext_hex: string, key_hex: string): any;

/**
 * Генерация случайной 16-байтной соли (hex).
 * Совместимо с серверным `RealCrypto::generate_salt`.
 */
export function generateEncryptionSalt(): string;

/**
 * Генерация случайного пароля.
 * Совместимо с серверным `PasswordGenerator`.
 */
export function generatePassword(length: number, lowercase: boolean, uppercase: boolean, digits: boolean, symbols: boolean): string;

/**
 * Генерация случайного 32-байтного ключа shared vault (hex).
 */
export function generateSharedVaultKey(): string;

/**
 * Генерация X25519 keypair.
 * Возвращает { public_key: hex, private_key: hex }
 *
 * Совместимо с серверным `RealCrypto::generate_x25519_keypair`.
 */
export function generateX25519Keypair(): any;

/**
 * Хэширование мастер-пароля для регистрации/аутентификации.
 * Возвращает { hash: PHC-строка, salt: строка }
 *
 * Совместимо с серверным `RealCrypto::hash_master_password`.
 */
export function hashMasterPassword(password: string): any;

export function init(): void;

/**
 * Проверка мастер-пароля против хеша из БД.
 * hash — PHC-строка (содержит соль внутри).
 *
 * Совместимо с серверным `RealCrypto::verify_master_password`.
 */
export function verifyMasterPassword(password: string, hash: string): boolean;

/**
 * X25519 Diffie-Hellman → SHA-256 → AES-256 key (hex).
 * Используется для обмена ключами shared vault.
 *
 * Совместимо с серверным `RealCrypto::x25519_derive_shared_key`.
 */
export function x25519DeriveSharedKey(private_key_hex: string, public_key_hex: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly decryptEntry: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly decryptRaw: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly deriveEncryptionKey: (a: number, b: number, c: number, d: number) => [number, number];
    readonly encryptEntry: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly encryptRaw: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly generateEncryptionSalt: () => [number, number, number, number];
    readonly generatePassword: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly generateSharedVaultKey: () => [number, number, number, number];
    readonly generateX25519Keypair: () => [number, number, number];
    readonly hashMasterPassword: (a: number, b: number) => [number, number, number];
    readonly verifyMasterPassword: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly x25519DeriveSharedKey: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly init: () => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
