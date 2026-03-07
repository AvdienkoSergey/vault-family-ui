# Vault Family — E2E-encrypted family password manager

React Native (Expo) mobile app with native cryptographic module.

## Architecture

```
app/                    # Screens (file-based routing)
+-- unlock.tsx          # Unlock / vault creation screen
+-- (tabs)/
|   +-- index.tsx       # Vault entries (encrypted SQLite)
|   +-- family.tsx      # Family management (shared vaults)
|   +-- generator.tsx   # Password generator
|   +-- settings.tsx    # Settings
components/             # UI components
+-- vault-entry-card.tsx
+-- entry-detail.tsx
+-- session-bar.tsx
lib/                    # Business logic
+-- crypto-bridge.ts    # Unified crypto API (native module wrapper)
+-- native-pbkdf2.ts    # PBKDF2-HMAC-SHA256 + PHC format
+-- master-key.ts       # Two-layer key architecture (v2)
+-- vault-db.ts         # SQLite encrypted vault storage
+-- use-vault-entries.ts # React hook for entry CRUD
+-- vault-context.tsx   # Session state + encryption key
+-- security-service.ts # Keychain + biometrics
+-- storage.ts          # File system (user directories)
+-- settings.ts         # Settings persistence
+-- settings-context.tsx
+-- clipboard.ts        # Clipboard (expo-clipboard)
+-- archive-service.ts  # Encrypted backup/restore
+-- use-auto-lock.ts    # Auto-lock on background timeout
+-- theme-context.tsx / theme.ts
+-- types.ts            # Branded types, validation
+-- data.ts             # Seed data (dev-only)
modules/
+-- expo-vault-crypto/  # Native Expo module (Kotlin + Swift)
    +-- android/        # javax.crypto (AES-GCM, PBKDF2), java.security (X25519)
    +-- ios/            # CryptoKit (AES-GCM, X25519), CommonCrypto (PBKDF2)
```

## Cryptographic Architecture

### Two-Layer Key Hierarchy (v2)

```
Master Password
      |
      v
PBKDF2-HMAC-SHA256 (600,000 iterations, 16-byte random salt)
      |
      v
Master Key (256-bit, derived)
      |
      +---> Decrypts Vault Key (AES-256-GCM)
                  |
                  v
            Vault Key (256-bit, random)
                  |
                  +---> Encrypts/decrypts all vault entries (AES-256-GCM)
                  +---> Per-entry unique 12-byte nonce
```

**Why two layers:**
- Password change only re-encrypts the Vault Key (1 operation), not all entries
- Vault Key is high-entropy random (not derived from password)
- Aligns with 1Password/Bitwarden architecture

### Algorithms

| Function | Algorithm | Parameters |
|----------|-----------|------------|
| Password hashing | PBKDF2-HMAC-SHA256 | 600,000 iterations, 16-byte salt, PHC format |
| Key derivation | PBKDF2-HMAC-SHA256 | 600,000 iterations, 32-byte output |
| Entry encryption | AES-256-GCM | 12-byte random nonce, 128-bit auth tag |
| Key exchange | X25519 Diffie-Hellman | 32-byte keys |
| Vault Key protection | AES-256-GCM | Encrypted with Master Key |
| Random generation | Platform CSPRNG | SecureRandom (Android) / SecRandomCopyBytes (iOS) |

### Platform implementations

| Operation | Android | iOS |
|-----------|---------|-----|
| PBKDF2 | `javax.crypto.SecretKeyFactory` | `CommonCrypto.CCKeyDerivationPBKDF` |
| AES-GCM | `javax.crypto.Cipher("AES/GCM/NoPadding")` | `CryptoKit.AES.GCM` |
| X25519 | `java.security.KeyPairGenerator` (API 31+) / pure Kotlin fallback | `CryptoKit.Curve25519` |
| CSPRNG | `java.security.SecureRandom` | `Security.SecRandomCopyBytes` |

## Data Storage

### File system structure

```
{documentDirectory}/users/
+-- user@example.com/
    +-- master.key       # { hash (PHC), encryption_salt, encrypted_vault_key, vault_key_nonce, version: 2 }
    +-- settings.json    # { theme, biometricEnabled, autoLockTimeout, ... }

{SQLite default directory}/
+-- vault_user_example.com.db   # Encrypted entries (SQLite)
```

### SQLite schema (vault.db)

```sql
CREATE TABLE entries (
  id              TEXT PRIMARY KEY,       -- UUID v4
  category        TEXT NOT NULL,          -- plaintext (for filtering)
  vault_type      TEXT NOT NULL,          -- 'personal' | 'shared'
  shared_vault_id TEXT,                   -- FK to shared vault
  favorite        INTEGER NOT NULL,       -- 0 | 1
  last_modified   TEXT NOT NULL,          -- ISO date
  encrypted_data  TEXT NOT NULL,          -- AES-256-GCM ciphertext (hex)
  nonce           TEXT NOT NULL           -- 12-byte GCM nonce (hex)
);
```

**Encrypted blob** contains: `{ title, url, login, password }` serialized as JSON before encryption.

**Plaintext metadata** (category, favorite, lastModified) allows filtering/sorting without decryption.

## Encrypted Backup (Archive Service)

### Triple protection

```
TLS (transport) → Archive encryption (PBKDF2 + AES-256-GCM) → Entry encryption (Vault Key)
```

### Export flow

```
User files (master.key, settings.json, vault_*.db)
      |
      v
JSON manifest (files encoded as base64)
      |
      v
UTF-8 → hex → encryptRaw(manifestHex, archiveKey)
      |
      v
ArchiveBlob { encrypted_data, nonce, salt, version: 1 }
```

`archiveKey` = `deriveEncryptionKey(masterPassword, freshSalt)` — 600K PBKDF2 iterations.

### Import flow

```
ArchiveBlob + master password
      |
      v
archiveKey = deriveEncryptionKey(password, salt)
      |
      v
decryptRaw → hex → UTF-8 → JSON.parse → manifest
      |
      v
Validate filenames (allowlist) → write to user directory
      |
      v
Standard unlock (master.key already contains vault_key)
```

### Security measures

- **Filename allowlist**: only `master.key`, `settings.json`, `vault_*.db`
- **Path traversal prevention**: rejects `..`, `/`, `\` in filenames
- **Wrong password**: AES-GCM tag mismatch → error (no crash)
- **No new dependencies**: uses existing `crypto-bridge.ts` primitives

### Serialization format

Archives serialize to a string with magic prefix `VFARCHIVE1:` + JSON. Functions: `serializeArchive()` / `deserializeArchive()`.

## Authentication Flow

1. **Vault creation** — PBKDF2 hashes password (PHC format), generates random Vault Key, encrypts it with Master Key, saves to `master.key` (v2)
2. **Password unlock** — verifies password via PHC hash, derives Master Key, decrypts Vault Key, opens SQLite DB. Stores Vault Key in Keychain for biometric fast-path
3. **Biometric unlock** — retrieves Vault Key directly from Keychain (BIOMETRY_CURRENT_SET + SECURE_HARDWARE). Skips PBKDF2 entirely — instant unlock (0 iterations vs 1.2M for password path)
4. **Lock** — closes SQLite, clears Vault Key and all decrypted entries from memory
5. **Password change** — re-hashes password, re-encrypts Vault Key with new Master Key. Entries are NOT re-encrypted (Vault Key unchanged)

### Auto-migration

- **v1 -> v2**: On first unlock after update, generates Vault Key, re-encrypts all entries, upgrades `master.key` to v2 format
- **PBKDF2 iteration upgrade**: If stored hash uses < 600K iterations, auto-rehashes on next unlock

## Roles

| Role   | Access |
|--------|--------|
| owner  | Full: family management, invite, revoke |
| editor | Read/write entries |
| viewer | Read-only (UI enforces edit/delete block) |

## Setup

```bash
yarn install
yarn start           # Dev server
yarn build:android   # Android APK
```

## Implemented

- Two-layer key hierarchy (Master Key -> Vault Key)
- PBKDF2-SHA256 600K iterations (OWASP compliant)
- Encrypted SQLite vault (AES-256-GCM per-entry)
- Entry CRUD: add, edit, delete, favorite toggle
- Native crypto module (Kotlin + Swift, no WASM)
- Biometric unlock with fast-path (Vault Key in Keychain, 0 PBKDF2 iterations)
- Auto-lock on background timeout
- Password generator (CSPRNG)
- Multi-user support
- Auto-migration v1 -> v2 with entry re-encryption
- Encrypted backup/restore (archive-service)

## TODO

- Backend sync (Axum API)
- X25519 key exchange for shared vaults
- Clipboard auto-clear after password copy
- Argon2id KDF (memory-hard, GPU-resistant)

---

## Security Audit

### Strengths

| Aspect | Implementation | Industry comparison |
|--------|---------------|---------------------|
| Entry encryption | AES-256-GCM, per-entry random 12-byte nonce | 1Password: AES-256-GCM, Bitwarden: AES-256-CBC. **On par with or better than industry** |
| KDF | PBKDF2-SHA256, 600K iterations | Bitwarden: 600K (client) + 100K (server). **Matches Bitwarden client-side** |
| Key hierarchy | Two-layer: Master Key decrypts random Vault Key | 1Password: MUK -> Vault Key. Bitwarden: Master Key -> Symmetric Key. **Matches industry** |
| Password change | Only re-encrypts Vault Key (O(1)), entries untouched | Same as 1Password/Bitwarden. **Correct architecture** |
| Biometric storage | Keychain + BIOMETRY_CURRENT_SET + SECURE_HARDWARE | Same as 1Password/Bitwarden mobile apps |
| Biometric fast-path | Vault Key stored in separate Keychain entry, skips PBKDF2 | Instant unlock (0 vs 1.2M PBKDF2 iterations). Key is 256-bit random, not password-derived |
| Constant-time verify | XOR-based comparison for password hash | Standard practice, prevents timing attacks |
| Nonce uniqueness | Fresh random 12-byte nonce per encryption call | Cryptographically correct for AES-GCM |
| Hash format | PHC standard (`$pbkdf2-sha256$i=600000$salt$hash`) | Portable, self-describing, server-compatible |
| Platform crypto | Native APIs (CryptoKit, javax.crypto), not JS | Avoids JS crypto pitfalls, hardware-accelerated |
| Auto-migration | Transparent v1->v2 upgrade with entry re-encryption | Ensures no user is left on weak settings |

### Known Limitations

| Aspect | Current state | Risk | Mitigation path |
|--------|--------------|------|-----------------|
| KDF algorithm | PBKDF2 (not Argon2id) | Medium: PBKDF2 is GPU-parallelizable | Argon2id requires native libsodium integration. Planned for future. 600K iterations provide adequate protection today |
| Metadata leakage | category, favorite, lastModified are plaintext in SQLite | Low: attacker with device access sees entry count and categories | Acceptable tradeoff for fast filtering. Full-DB encryption (SQLCipher) is an option |
| JS memory | Vault Key lives as hex string in React state | Low: JS GC doesn't guarantee zeroization | Platform limitation. Auto-lock minimizes exposure window. Same constraint as all RN password managers |
| No Secret Key | Unlike 1Password, no additional device-bound secret | Low: offline brute-force of master.key requires device access | 600K PBKDF2 makes brute-force expensive (~$100K+ for 12-char password). Secret Key planned for multi-device sync |
| SQLite not file-encrypted | DB file is not encrypted at filesystem level (entries are) | Low: all sensitive data is AES-256-GCM encrypted per-field | Only plaintext metadata is exposed. SQLCipher is an option for defense-in-depth |
| No server-side stretching | Single KDF pass (client only) | Low: offline-only app, no server hash to leak | When backend sync is added, server should add 100K+ PBKDF2 pass (like Bitwarden) |

### Comparison with industry leaders

```
Feature                    Vault Family    1Password       Bitwarden
----------------------------------------------------------------------
Entry encryption           AES-256-GCM     AES-256-GCM     AES-256-CBC
KDF                        PBKDF2 600K     Argon2id        PBKDF2 600K
Key hierarchy              2-layer         3-layer         2-layer
Secret Key                 No              Yes (128-bit)   No
Per-entry nonce            Yes             Yes             Yes (IV)
Biometric (mobile)         Keychain+HW     Keychain+HW     Keychain+HW
Biometric PBKDF2 skip      Yes (0 iter)    Yes             Yes
Native crypto              Yes             Yes             Yes
Open source                Yes             No (client)     Yes
Offline-first              Yes             No              No
```

### Threat model

**Protected against:**
- Network interception (all data encrypted at rest, no network by default)
- Database theft (entries encrypted with random Vault Key, AES-256-GCM)
- Password change performance (O(1) via Vault Key architecture)
- Weak password hashing (600K PBKDF2 iterations, auto-upgrade from lower counts)
- Biometric bypass (Keychain requires BIOMETRY_CURRENT_SET, device-only, Vault Key in separate service)

**Requires physical device access + brute-force for:**
- master.key extraction (PHC hash, 600K iterations)
- SQLite metadata analysis (categories, timestamps visible)

**Not yet protected against:**
- GPU-accelerated brute-force (Argon2id would add memory-hardness)
- Device compromise with memory dump (JS runtime limitation)
- Multi-device sync interception (not implemented yet)
