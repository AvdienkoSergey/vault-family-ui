/**
 * SecurityService — Keychain + Biometrics bridge.
 * All functions are stubs until react-native-keychain is integrated.
 */

export function authenticateWithBiometrics(): Promise<boolean> {
  throw new Error(
    "NOT_IMPLEMENTED: integrate react-native-keychain with Biometrics (FaceID/TouchID)"
  )
}

export function storeMasterKey(_key: Uint8Array): Promise<void> {
  throw new Error(
    "NOT_IMPLEMENTED: store VaultPass in Keychain with biometric-protected access control"
  )
}

export function retrieveMasterKey(): Promise<Uint8Array> {
  throw new Error(
    "NOT_IMPLEMENTED: retrieve VaultPass from Keychain after biometric verification"
  )
}

export function clearMasterKey(): Promise<void> {
  throw new Error(
    "NOT_IMPLEMENTED: clear VaultPass from Keychain and zeroize in-memory copy"
  )
}
