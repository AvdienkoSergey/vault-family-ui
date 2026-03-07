# Changelog

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
