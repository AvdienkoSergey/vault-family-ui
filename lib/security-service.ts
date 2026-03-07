import * as Keychain from "react-native-keychain"
import type { Email, Password } from "./types"

const SERVICE_NAME = "com.vaultfamily.credentials"
const VAULT_KEY_SERVICE = "com.vaultfamily.vaultkey"

/**
 * Check if biometric authentication is available on the device.
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  const type = await Keychain.getSupportedBiometryType()
  return type !== null
}

/**
 * Store email + master password in Keychain, protected by biometrics.
 * Called after a successful manual login / vault creation.
 */
export async function storeCredentials(
  email: Email,
  password: Password,
): Promise<void> {
  await Keychain.setGenericPassword(email, password, {
    service: SERVICE_NAME,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  })
}

/**
 * Retrieve email + password from Keychain after biometric verification.
 * Returns null if no stored credentials or user cancels biometric prompt.
 */
export async function retrieveCredentials(): Promise<{
  email: string
  password: string
} | null> {
  try {
    const result = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
      authenticationPrompt: {
        title: "Unlock Vault Family",
        subtitle: "Authenticate to access your vault",
        cancel: "Cancel",
      },
    })
    if (result === false) return null
    return { email: result.username, password: result.password }
  } catch {
    return null
  }
}

/**
 * Check if there are stored credentials (without triggering biometric prompt).
 */
export async function hasStoredCredentials(): Promise<boolean> {
  try {
    const result = await Keychain.hasGenericPassword({ service: SERVICE_NAME })
    return result
  } catch {
    return false
  }
}

/**
 * Clear stored credentials from Keychain.
 */
export async function clearCredentials(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE_NAME })
  await Keychain.resetGenericPassword({ service: VAULT_KEY_SERVICE })
}

// ---------------------------------------------------------------------------
// Vault key storage (for instant biometric unlock — skips PBKDF2)
// ---------------------------------------------------------------------------

/**
 * Store email + vaultKey in a separate Keychain entry, protected by biometrics.
 * Called after every successful unlock so biometric path can skip PBKDF2.
 */
export async function storeVaultKey(
  email: Email,
  vaultKey: string,
): Promise<void> {
  await Keychain.setGenericPassword(email, vaultKey, {
    service: VAULT_KEY_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
  })
}

/**
 * Retrieve email + vaultKey from Keychain after biometric verification.
 * Returns null if no stored key or user cancels biometric prompt.
 */
export async function retrieveVaultKey(): Promise<{
  email: string
  vaultKey: string
} | null> {
  try {
    const result = await Keychain.getGenericPassword({
      service: VAULT_KEY_SERVICE,
      authenticationPrompt: {
        title: "Unlock Vault Family",
        subtitle: "Authenticate to access your vault",
        cancel: "Cancel",
      },
    })
    if (result === false) return null
    return { email: result.username, vaultKey: result.password }
  } catch {
    return null
  }
}
