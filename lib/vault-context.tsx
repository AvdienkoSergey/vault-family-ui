import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  changeMasterPassword as changeMasterPw,
  createMasterKey,
  hasMasterKey,
  verifyAndDeriveKey,
  migrateToV2,
} from "./master-key";
import {
  hasStoredCredentials,
  storeCredentials,
  storeVaultKey,
  retrieveVaultKey,
} from "./security-service";
import { ensureUserDir } from "./storage";
import { openVaultDb, closeVaultDb, reEncryptAllEntries } from "./vault-db";
import type { Email, Password, SessionState, UserProfile } from "./types";
import { parseEmail } from "./types";

interface VaultContextType {
  currentUser: UserProfile | null;
  currentEmail: Email | null;
  userDir: string | null;
  sessionState: SessionState;
  encryptionKey: string | null;
  pendingBiometricEnroll: boolean;
  unlock: (email: Email, password: Password) => Promise<{ error?: string }>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
  completeBiometricEnroll: (accepted: boolean) => void;
  changePassword: (
    oldPassword: Password,
    newPassword: Password
  ) => Promise<{ error?: string }>;
}

const VaultContext = createContext<VaultContextType | null>(null);

async function activateSession(
  email: Email,
  setCurrentUser: (u: UserProfile) => void,
  setCurrentEmail: (e: Email) => void,
  setUserDir: (d: string) => void,
  setSessionState: (s: SessionState) => void
) {
  const dir = await ensureUserDir(email);
  const name = email.split("@")[0];
  setCurrentUser({
    id: "u1",
    name,
    role: "owner",
    avatar: name.charAt(0).toUpperCase(),
  });
  setCurrentEmail(email);
  setUserDir(dir);
  setSessionState("active");
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("locked");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userDir, setUserDir] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [pendingBiometricEnroll, setPendingBiometricEnroll] = useState(false);
  const pendingCredsRef = useRef<{ email: Email; password: Password; vaultKey: string } | null>(
    null
  );

  const unlock = useCallback(
    async (email: Email, password: Password): Promise<{ error?: string }> => {
      const exists = await hasMasterKey(email);
      let vaultKey: string;
      if (exists) {
        const result = await verifyAndDeriveKey(email, password);
        if (!result) return { error: "Incorrect master password" };

        openVaultDb(email);

        if (result.needsMigration && result.oldEntryKey) {
          // v1 -> v2: generate vault_key, re-encrypt all entries
          const newVaultKey = await migrateToV2(email, password);
          reEncryptAllEntries(result.oldEntryKey, newVaultKey);
          vaultKey = newVaultKey;
        } else {
          vaultKey = result.vaultKey;
        }
      } else {
        vaultKey = await createMasterKey(email, password);
        openVaultDb(email);
      }

      setEncryptionKey(vaultKey);

      await activateSession(
        email,
        setCurrentUser,
        setCurrentEmail,
        setUserDir,
        setSessionState
      );

      // Only offer biometric enrollment if not already enrolled
      const alreadyEnrolled = await hasStoredCredentials();
      if (!alreadyEnrolled) {
        pendingCredsRef.current = { email, password, vaultKey };
        setPendingBiometricEnroll(true);
      } else {
        // Update stored credentials + vault key for biometric fast-path
        storeCredentials(email, password).catch(() => {});
        storeVaultKey(email, vaultKey).catch(() => {});
      }
      return {};
    },
    []
  );

  const completeBiometricEnroll = useCallback((accepted: boolean) => {
    if (accepted && pendingCredsRef.current) {
      const { email, password, vaultKey } = pendingCredsRef.current;
      storeCredentials(email, password).catch(() => {});
      storeVaultKey(email, vaultKey).catch(() => {});
    }
    pendingCredsRef.current = null;
    setPendingBiometricEnroll(false);
  }, []);

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    // Fast path: retrieve vaultKey directly from keychain (no PBKDF2)
    const stored = await retrieveVaultKey();
    if (!stored) return false;

    const emailResult = parseEmail(stored.email as Email);
    if (!emailResult.ok) return false;

    openVaultDb(emailResult.value);
    setEncryptionKey(stored.vaultKey);
    await activateSession(
      emailResult.value,
      setCurrentUser,
      setCurrentEmail,
      setUserDir,
      setSessionState
    );
    return true;
  }, []);

  const changePassword = useCallback(
    async (
      oldPassword: Password,
      newPassword: Password
    ): Promise<{ error?: string }> => {
      if (!currentEmail) return { error: "No active session" };
      const newKey = await changeMasterPw(
        currentEmail,
        oldPassword,
        newPassword
      );
      if (!newKey) return { error: "Current password is incorrect" };
      setEncryptionKey(newKey);
      storeCredentials(currentEmail, newPassword).catch(() => {});
      return {};
    },
    [currentEmail]
  );

  const lock = useCallback(() => {
    closeVaultDb();
    setCurrentUser(null);
    setCurrentEmail(null);
    setUserDir(null);
    setEncryptionKey(null);
    setSessionState("locked");
  }, []);

  return (
    <VaultContext.Provider
      value={{
        currentUser,
        currentEmail,
        userDir,
        sessionState,
        encryptionKey,
        pendingBiometricEnroll,
        unlock,
        unlockWithBiometrics,
        lock,
        completeBiometricEnroll,
        changePassword,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) throw new Error("useVault must be used within VaultProvider");
  return context;
}
