# Changelog

## [1.5.1](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.5.0...v1.5.1) (2026-03-07)


### Bug Fixes

* **ci:** improve iOS build diagnostics and scheme resolution ([f7afccb](https://github.com/AvdienkoSergey/vault-family-ui/commit/f7afccb33a1dd925b92f67033b71cb5e7b7091d5))
* **ci:** improve iOS build diagnostics and scheme resolution ([50fa97d](https://github.com/AvdienkoSergey/vault-family-ui/commit/50fa97d2eb2163838bcf45e717a76f5a8df0efb4))

## [1.5.0](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.4.0...v1.5.0) (2026-03-07)


### Features

* SQLite encrypted vault storage and biometric fast-path unlock ([34fd707](https://github.com/AvdienkoSergey/vault-family-ui/commit/34fd707604b14376d73b833b27ee4499dd0e7ea8))


### Bug Fixes

* **ci:** improve iOS build debugging and error handling ([a32efbc](https://github.com/AvdienkoSergey/vault-family-ui/commit/a32efbc0e329247613e6fb5530f9aa664abe9141))
* **ci:** improve iOS build debugging and error handling ([e2ab437](https://github.com/AvdienkoSergey/vault-family-ui/commit/e2ab43795d9dfaac43cae88510ec823693356859))

## [1.4.0](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.3.2...v1.4.0) (2026-03-07)


### Features

* **storage:** add deleteUserDir, listUserFiles and async master-key ops ([ac4cecb](https://github.com/AvdienkoSergey/vault-family-ui/commit/ac4cecb5d0e7a51cec74b4ff339fc449dd8c66ec))
* **test:** add Jest config and test infrastructure ([ace5c20](https://github.com/AvdienkoSergey/vault-family-ui/commit/ace5c2027af0663a8618e07997df0b0423b55f28))


### Bug Fixes

* **ci:** use find to locate .app bundle in iOS build output ([da567d4](https://github.com/AvdienkoSergey/vault-family-ui/commit/da567d43a5611ca29b56b461bc772094d1ad3762))

## [1.3.2](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.3.1...v1.3.2) (2026-03-07)


### Bug Fixes

* **ci:** patch import.meta.url for Hermes and auto-detect iOS scheme ([8500246](https://github.com/AvdienkoSergey/vault-family-ui/commit/8500246fe35c3afa018306b3d8ebde859a90526d))
* **ci:** patch import.meta.url for Hermes and auto-detect iOS scheme ([e4bd28d](https://github.com/AvdienkoSergey/vault-family-ui/commit/e4bd28d78b4b5846e46693c4a51c810fdf5b4cb2))

## [1.3.1](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.3.0...v1.3.1) (2026-03-07)


### Bug Fixes

* **ci:** switch from npm to yarn in release workflows ([4964003](https://github.com/AvdienkoSergey/vault-family-ui/commit/496400383a9c1126ce0c86933f6542f5d0de32a5))
* **ci:** switch from npm to yarn in release workflows ([bc6a7db](https://github.com/AvdienkoSergey/vault-family-ui/commit/bc6a7db0880d27e673409ba0d508179fcbb09b57))

## [1.3.0](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.2.1...v1.3.0) (2026-03-07)


### Features

* **auth:** verify master password via WASM and derive encryption key ([17ac992](https://github.com/AvdienkoSergey/vault-family-ui/commit/17ac99279f4bbbbfdcf4abe9bc4c6493971c1a36))
* **ci:** add iOS simulator build to release workflow ([65a3d60](https://github.com/AvdienkoSergey/vault-family-ui/commit/65a3d602e63fe233106a1777b8d30155a3da57ca))
* **clipboard:** implement copyToClipboard with expo-clipboard ([bf3c854](https://github.com/AvdienkoSergey/vault-family-ui/commit/bf3c85449475246da8f501087a2109a3efd144ab))
* **crypto:** add Rust WASM crypto module (vault-crypto-wasm) ([0ae89f1](https://github.com/AvdienkoSergey/vault-family-ui/commit/0ae89f10dedc9b414d97ddcfaf1c4849011d8d58))
* **generator:** replace Math.random with WASM CSPRNG password generator ([1b8147e](https://github.com/AvdienkoSergey/vault-family-ui/commit/1b8147e1c6b3c6911c3772601041dac42e6afd77))
* **security:** implement auto-lock on app background timeout ([b29ac75](https://github.com/AvdienkoSergey/vault-family-ui/commit/b29ac754f27808adc81ca3c4fea21c67c50a48eb))
* **settings:** add change master password and auto-lock timeout picker ([cd195bf](https://github.com/AvdienkoSergey/vault-family-ui/commit/cd195bfec3feb5a4c352ace19670be3c4e3e0b47))
* **wasm:** integrate WASM bridge with Metro bundling and full crypto API ([140e4c0](https://github.com/AvdienkoSergey/vault-family-ui/commit/140e4c0bdd72d71c6379fbe2f0dcb462b67fa044))


### Bug Fixes

* **unlock:** add biometric enrollment modal and password error handling ([048eaa4](https://github.com/AvdienkoSergey/vault-family-ui/commit/048eaa4e35cc1c577d4f66f6aefa594cbfc60290))


### Miscellaneous Chores

* add new folder in gitignore ([9f19f58](https://github.com/AvdienkoSergey/vault-family-ui/commit/9f19f58d767f59758d1d4cadb69903a66187a131))

## [1.2.1](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.2.0...v1.2.1) (2026-03-07)


### Bug Fixes

* **deps:** sync lock files with react-native-keychain dependency ([56783fc](https://github.com/AvdienkoSergey/vault-family-ui/commit/56783fca6b46becdd9aa22ce656283d7d5778c6d))

## [1.2.0](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.1.1...v1.2.0) (2026-03-07)


### Features

* **app:** switch to Vault Family icons and fix splash screen gap ([c2fbf73](https://github.com/AvdienkoSergey/vault-family-ui/commit/c2fbf73c65a5ce25a9daf512175952d435031aaa))
* **assets:** add Vault Family launcher icons ([0fc2926](https://github.com/AvdienkoSergey/vault-family-ui/commit/0fc29262c8c0b4b59fded2b8d297e5a48070368d))
* **auth:** add unlock screen with master password flow ([ac9d1c3](https://github.com/AvdienkoSergey/vault-family-ui/commit/ac9d1c3f441b3d73bb3788c154e578165c39cba1))
* **auth:** add user storage and sign-in mode for returning users ([2e3b600](https://github.com/AvdienkoSergey/vault-family-ui/commit/2e3b600090e3a7624c198b1b2afc1daa529737e0))
* **auth:** implement biometric unlock via react-native-keychain ([4e9ae53](https://github.com/AvdienkoSergey/vault-family-ui/commit/4e9ae53b93e973403a2f2bc2ecbe9d4058ab1b9a))
* **settings:** add dark/light theme toggle ([1a29b28](https://github.com/AvdienkoSergey/vault-family-ui/commit/1a29b28a488b96edc83d081550b1f14f6f35a113))
* **settings:** add persistent app settings service and context ([bd38392](https://github.com/AvdienkoSergey/vault-family-ui/commit/bd3839253d77c2770865bcfd8e4ca1a917bbd76c))
* **settings:** move actions to profile card and add delete account modal ([bebfc8f](https://github.com/AvdienkoSergey/vault-family-ui/commit/bebfc8f81679a7bc86085e11cc97ab44b860135b))
* **settings:** persist theme and security toggles via settings.json ([49f7f45](https://github.com/AvdienkoSergey/vault-family-ui/commit/49f7f453f57d4952e2b68a451efc9f87aa6cd75c))
* **settings:** preload user settings on unlock and show storage files ([8321c0d](https://github.com/AvdienkoSergey/vault-family-ui/commit/8321c0d5e87607c18b6da11f4679656f7eb22abf))
* **splash:** upgrade splash generator to v4 with studio branding ([bac93f0](https://github.com/AvdienkoSergey/vault-family-ui/commit/bac93f055b7ac6310ebb386552014241f2fa9a85))
* **storage:** add deleteUserDir to remove user vault directory ([bb35f77](https://github.com/AvdienkoSergey/vault-family-ui/commit/bb35f77c4b681d95d57b282f46d94393de5560eb))
* **types:** add branded Email and Password types with validation ([1e38c0a](https://github.com/AvdienkoSergey/vault-family-ui/commit/1e38c0ac61653c1b7ca201c688e2f6b93f0f98bf))


### Bug Fixes

* **android:** use absolute path for gradlew and sync lock files ([38daa10](https://github.com/AvdienkoSergey/vault-family-ui/commit/38daa1032d9dc427adbb0c5c6a128ff9821d4ed7))
* **metro:** increase Node.js heap limit to prevent OOM crashes ([1680611](https://github.com/AvdienkoSergey/vault-family-ui/commit/1680611ff3bb601255a2efe5564a87bc23f63220))
* **splash:** eliminate black screen between splash and unlock ([d8cc1bc](https://github.com/AvdienkoSergey/vault-family-ui/commit/d8cc1bcfa24c4a7c2ed958f910b66b325acda34d))
* **unlock:** remember last selected email when switching modes ([260ed16](https://github.com/AvdienkoSergey/vault-family-ui/commit/260ed16b1a64b370940668435de6138b0ed6964d))


### Miscellaneous Chores

* **assets:** remove default Expo template images ([e345b66](https://github.com/AvdienkoSergey/vault-family-ui/commit/e345b6639c3e0dee4f305d9f2a4f57d30e9b4977))

## [1.1.1](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.1.0...v1.1.1) (2026-03-05)


### Bug Fixes

* **ci:** use gradlew assembleRelease instead of expo run:android ([8de0e91](https://github.com/AvdienkoSergey/vault-family-ui/commit/8de0e91e7a9f7ad2b2a11c1ba25f98fec26ac704))

## [1.1.0](https://github.com/AvdienkoSergey/vault-family-ui/compare/v1.0.0...v1.1.0) (2026-03-05)


### Features

* add app layout and main screens ([209a920](https://github.com/AvdienkoSergey/vault-family-ui/commit/209a9202263f643d3c8119313fa526f7057b8d73))
* add core types, theme and data layer ([95d1944](https://github.com/AvdienkoSergey/vault-family-ui/commit/95d194498ab467c2d396182e4c2ce017042502fc))
* add security service, WASM bridge and vault context ([9b434b3](https://github.com/AvdienkoSergey/vault-family-ui/commit/9b434b3af28b98f77862485a52ca4441f5da8a9c))
* add UI components ([c931fa7](https://github.com/AvdienkoSergey/vault-family-ui/commit/c931fa700cc39e0f34a2942f7a23a1f7939cad43))


### Miscellaneous Chores

* configure build, splash and tab safe area ([25a16f4](https://github.com/AvdienkoSergey/vault-family-ui/commit/25a16f46d3ff57f08d747e77da915cc351641d38))
* remove Expo boilerplate ([2bfaf2a](https://github.com/AvdienkoSergey/vault-family-ui/commit/2bfaf2a8e0b2c69742aaf37026b45fa9eb299c3e))
