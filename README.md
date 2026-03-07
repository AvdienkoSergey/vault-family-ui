# Vault Family — E2E-зашифрованный семейный менеджер паролей

React Native (Expo) приложение с Rust/WASM криптографическим ядром.

## Архитектура

```
app/                    # Экраны (file-based routing)
├── unlock.tsx          # Экран разблокировки / создания хранилища
├── (tabs)/
│   ├── index.tsx       # Хранилище записей
│   ├── family.tsx      # Управление семьёй (shared vaults)
│   ├── generator.tsx   # Генератор паролей
│   └── settings.tsx    # Настройки
components/             # UI-компоненты
├── vault-entry-card.tsx
├── entry-detail.tsx
└── session-bar.tsx
lib/                    # Бизнес-логика
├── crypto-wasm/        # Rust WASM-модуль (скомпилированный)
├── wasm-bridge.ts      # Мост к WASM: инициализация + API
├── master-key.ts       # Хеширование, верификация, смена мастер-пароля
├── vault-context.tsx   # Состояние сессии + ключ шифрования
├── security-service.ts # Keychain + биометрия
├── storage.ts          # Файловая система (директории пользователей)
├── settings.ts         # Настройки (theme, biometric, auto-lock)
├── settings-context.tsx
├── clipboard.ts        # Копирование в буфер обмена (expo-clipboard)
├── use-auto-lock.ts    # Хук автоблокировки по таймауту
├── theme-context.tsx
├── theme.ts
├── types.ts            # Брендированные типы, валидация
└── data.ts             # Мок-данные
```

## Криптография (WASM)

Rust-модуль `vault-crypto-wasm` обеспечивает серверную совместимость:

- **PBKDF2-HMAC-SHA256** (600 000 итераций) — хеширование мастер-пароля
- **AES-256-GCM** — шифрование записей и сырых данных
- **X25519 Diffie-Hellman** — обмен ключами для shared vaults
- **zeroize** — зануление промежуточных буферов в WASM-памяти

Крейты: `aes-gcm 0.10.3`, `pbkdf2 0.12.2`, `x25519-dalek 2.0.1`

## Поток аутентификации

1. **Создание хранилища** — `hashMasterPassword` создаёт PHC-хеш, `generateEncryptionSalt` + `deriveEncryptionKey` порождают ключ шифрования. Всё сохраняется в `master.key`.
2. **Вход по паролю** — `verifyMasterPassword` проверяет пароль, `deriveEncryptionKey` восстанавливает ключ в память.
3. **Биометрия** — email + пароль хранятся в Keychain (`react-native-keychain`) с защитой `BIOMETRY_CURRENT_SET`. При разблокировке — автоматическая верификация + деривация ключа.
4. **Блокировка** — ключ шифрования обнуляется в памяти.

## Структура данных

```
{documentDirectory}/users/
└── user@example.com/
    ├── master.key       # { hash (PHC), encryption_salt (hex) }
    └── settings.json    # { theme, biometricEnabled, autoLockTimeout, ... }
```

## Роли

| Роль     | Доступ                                     |
|----------|--------------------------------------------|
| owner    | Полный: управление семьёй, invite, revoke  |
| editor   | Чтение и запись записей                    |
| viewer   | Только чтение (UI блокирует edit/delete)   |

## Запуск

1. Установка зависимостей:

   ```bash
   yarn install
   ```

2. Запуск dev-сервера:

   ```bash
   yarn start
   ```

3. Сборка Android APK:

   ```bash
   yarn build:android
   ```

## Реализованное

- Экран разблокировки с переключением режимов (создание / вход)
- Верификация мастер-пароля через WASM (PBKDF2 600K итераций)
- Деривация ключа шифрования (AES-256) при каждом входе
- Биометрическая разблокировка (Keychain + FaceID/TouchID)
- Модалка подключения биометрии с явными кнопками (не закрывается тапом за пределы)
- Многопользовательская поддержка (выбор аккаунта чипами)
- Предзагрузка темы до разблокировки (без мерцания)
- Splash screen без чёрного экрана при переходе
- Удаление аккаунта с очисткой директории
- Генератор паролей через WASM CSPRNG (криптографически безопасный)
- Копирование в буфер обмена (expo-clipboard)
- Смена мастер-пароля (verify old → re-hash → re-derive key)
- Auto-lock по таймауту при уходе в фон (1/5/15/30 мин / never)
- Полный WASM-мост ко всем 13 крипто-функциям модуля

## TODO

- Шифрование/расшифровка записей (encrypt/decrypt через `encryptionKey`)
- Синхронизация с бэкендом (Axum API)
- X25519 обмен ключами для shared vaults
- Авто-очистка буфера обмена после копирования пароля
