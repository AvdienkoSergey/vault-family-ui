# Экспортируемые функции

- `hashMasterPassword(password)` - PBKDF2 хеширование => { hash, salt }
- `verifyMasterPassword(password, hash)` - Проверка пароля => boolean
- `deriveEncryptionKey(password, salt)` - 600K итераций PBKDF2 => hex ключ
- `generateEncryptionSalt()` - Случайная 16-байт соль (hex)
- `encryptEntry(entryJson, keyHex)` - AES-256-GCM => { encrypted_data, nonce }
- `decryptEntry(encryptedDataHex, nonceHex, keyHex)` - AES-256-GCM => JSON
- `encryptRaw(plaintextHex, keyHex)` - Шифрование сырых данных (shared vault keys)
- `decryptRaw(ciphertextHex, nonceHex, keyHex)` - Расшифровка сырых данных
- `generateX25519Keypair()` - => { public_key, private_key } (hex)
- `x25519DeriveSharedKey(privateHex, publicHex)` - DH => SHA-256 => AES ключ
- `generateSharedVaultKey()` - Случайный 32-байт ключ (hex)
- `generatePassword(len, lower, upper, digits, symbols)` - Генератор паролей

## Полная совместимость с сервером

Те же крейты, те же версии, те же параметры:

- aes-gcm 0.10.3 (AES-256-GCM)
- pbkdf2 0.12.2 (600 000 итераций, SHA-256)
- x25519-dalek 2.0.1 (Diffie-Hellman)
- zeroize для зануления промежуточных буфер

## Использование в React Native

```ts
import init, {
  deriveEncryptionKey,
  encryptEntry,
  decryptEntry,
  hashMasterPassword,
} from "vault-crypto-wasm";

// 1. Инициализация WASM
await init();

// 2. Регистрация — хеш мастер-пароля
const { hash, salt } = hashMasterPassword("MyP@ssw0rd!");

// 3. Деривация ключа шифрования (E2E — ключ не уходит на сервер)
const encryptionKey = deriveEncryptionKey("MyP@ssw0rd!", encryptionSalt);

// 4. Шифрование записи
const entry = JSON.stringify({
  service_name: "GitHub",
  service_url: "https://github.com",
  login: "user@mail.com",
  password: "secret123",
  notes: "",
});
const { encrypted_data, nonce } = encryptEntry(entry, encryptionKey);

// 5. Расшифровка записи
const json = decryptEntry(encrypted_data, nonce, encryptionKey);
const plain = JSON.parse(json);
```
