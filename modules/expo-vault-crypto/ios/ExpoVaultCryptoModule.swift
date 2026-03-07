import ExpoModulesCore
import CommonCrypto
import CryptoKit
import Security

public class ExpoVaultCryptoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoVaultCrypto")

        // -----------------------------------------------------------
        // PBKDF2-HMAC-SHA256
        // -----------------------------------------------------------

        Function("pbkdf2") { (password: String, saltBase64: String, iterations: Int, keyLength: Int) -> String in
            guard let saltData = Data(base64Encoded: Self.padBase64(saltBase64)) else {
                throw CryptoError("Invalid base64 salt")
            }

            var derivedKey = Data(count: keyLength)
            let status = derivedKey.withUnsafeMutableBytes { derivedBytes in
                saltData.withUnsafeBytes { saltBytes in
                    CCKeyDerivationPBKDF(
                        CCPBKDFAlgorithm(kCCPBKDF2),
                        password,
                        password.utf8.count,
                        saltBytes.bindMemory(to: UInt8.self).baseAddress!,
                        saltData.count,
                        CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                        UInt32(iterations),
                        derivedBytes.bindMemory(to: UInt8.self).baseAddress!,
                        keyLength
                    )
                }
            }
            guard status == kCCSuccess else {
                throw CryptoError("PBKDF2 failed: \(status)")
            }
            return derivedKey.hexString
        }

        Function("generateSalt") { (byteLength: Int) -> String in
            var bytes = [UInt8](repeating: 0, count: byteLength)
            let status = SecRandomCopyBytes(kSecRandomDefault, byteLength, &bytes)
            guard status == errSecSuccess else {
                throw CryptoError("Random generation failed")
            }
            return Data(bytes).base64EncodedString().replacingOccurrences(of: "=", with: "")
        }

        // -----------------------------------------------------------
        // AES-256-GCM (string plaintext — vault entries)
        // -----------------------------------------------------------

        Function("encryptAesGcm") { (plaintext: String, keyHex: String) -> [String: String] in
            let keyData = try Data(hex: keyHex)
            let key = SymmetricKey(data: keyData)
            let plaintextData = Data(plaintext.utf8)

            let sealedBox = try AES.GCM.seal(plaintextData, using: key, nonce: AES.GCM.Nonce())
            // combined = nonce (12) + ciphertext + tag (16)
            guard let combined = sealedBox.combined else {
                throw CryptoError("AES-GCM seal failed")
            }
            let nonce = combined.prefix(12)
            let ciphertextAndTag = combined.suffix(from: 12)

            return [
                "encrypted_data": ciphertextAndTag.hexString,
                "nonce": nonce.hexString
            ]
        }

        Function("decryptAesGcm") { (ciphertextHex: String, nonceHex: String, keyHex: String) -> String in
            let keyData = try Data(hex: keyHex)
            let key = SymmetricKey(data: keyData)
            let nonce = try AES.GCM.Nonce(data: Data(hex: nonceHex))
            let ciphertextAndTag = try Data(hex: ciphertextHex)

            let sealedBox = try AES.GCM.SealedBox(nonce: nonce, combined: nonce + ciphertextAndTag)
            let plaintext = try AES.GCM.open(sealedBox, using: key)
            guard let result = String(data: plaintext, encoding: .utf8) else {
                throw CryptoError("Decrypted data is not valid UTF-8")
            }
            return result
        }

        // -----------------------------------------------------------
        // AES-256-GCM raw (hex plaintext — shared vault keys)
        // -----------------------------------------------------------

        Function("encryptAesGcmRaw") { (plaintextHex: String, keyHex: String) -> [String: String] in
            let keyData = try Data(hex: keyHex)
            let key = SymmetricKey(data: keyData)
            let plaintextData = try Data(hex: plaintextHex)

            let sealedBox = try AES.GCM.seal(plaintextData, using: key, nonce: AES.GCM.Nonce())
            guard let combined = sealedBox.combined else {
                throw CryptoError("AES-GCM seal failed")
            }
            let nonce = combined.prefix(12)
            let ciphertextAndTag = combined.suffix(from: 12)

            return [
                "encrypted_data": ciphertextAndTag.hexString,
                "nonce": nonce.hexString
            ]
        }

        Function("decryptAesGcmRaw") { (ciphertextHex: String, nonceHex: String, keyHex: String) -> String in
            let keyData = try Data(hex: keyHex)
            let key = SymmetricKey(data: keyData)
            let nonce = try AES.GCM.Nonce(data: Data(hex: nonceHex))
            let ciphertextAndTag = try Data(hex: ciphertextHex)

            let sealedBox = try AES.GCM.SealedBox(nonce: nonce, combined: nonce + ciphertextAndTag)
            let plaintext = try AES.GCM.open(sealedBox, using: key)
            return plaintext.hexString
        }

        // -----------------------------------------------------------
        // X25519 key exchange
        // -----------------------------------------------------------

        Function("generateX25519Keypair") { () -> [String: String] in
            let privateKey = Curve25519.KeyAgreement.PrivateKey()
            return [
                "public_key": privateKey.publicKey.rawRepresentation.hexString,
                "private_key": privateKey.rawRepresentation.hexString
            ]
        }

        Function("x25519DeriveSharedKey") { (privateKeyHex: String, publicKeyHex: String) -> String in
            let privData = try Data(hex: privateKeyHex)
            let pubData = try Data(hex: publicKeyHex)

            let privateKey = try Curve25519.KeyAgreement.PrivateKey(rawRepresentation: privData)
            let publicKey = try Curve25519.KeyAgreement.PublicKey(rawRepresentation: pubData)

            let shared = try privateKey.sharedSecretFromKeyAgreement(with: publicKey)
            // Return raw shared secret bytes as hex (32 bytes)
            return shared.withUnsafeBytes { Data(Array($0)) }.hexString
        }
    }

    private static func padBase64(_ b64: String) -> String {
        let r = b64.count % 4
        return r == 0 ? b64 : b64 + String(repeating: "=", count: 4 - r)
    }
}

// MARK: - Helpers

private struct CryptoError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

extension Data {
    init(hex: String) throws {
        let len = hex.count
        guard len % 2 == 0 else { throw CryptoError("Invalid hex string") }
        var data = Data(capacity: len / 2)
        var index = hex.startIndex
        for _ in 0..<len/2 {
            let nextIndex = hex.index(index, offsetBy: 2)
            guard let byte = UInt8(hex[index..<nextIndex], radix: 16) else {
                throw CryptoError("Invalid hex character")
            }
            data.append(byte)
            index = nextIndex
        }
        self = data
    }

    var hexString: String {
        map { String(format: "%02x", $0) }.joined()
    }
}
