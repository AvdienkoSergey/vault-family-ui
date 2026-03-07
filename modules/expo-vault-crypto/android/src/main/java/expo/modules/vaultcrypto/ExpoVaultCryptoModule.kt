package expo.modules.vaultcrypto

import android.os.Build
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec

class ExpoVaultCryptoModule : Module() {

    private val secureRandom = SecureRandom()

    override fun definition() = ModuleDefinition {
        Name("ExpoVaultCrypto")

        // ---------------------------------------------------------------
        // PBKDF2-HMAC-SHA256
        // ---------------------------------------------------------------

        Function("pbkdf2") { password: String, saltBase64: String, iterations: Int, keyLength: Int ->
            val salt = Base64.decode(padBase64(saltBase64), Base64.DEFAULT)
            val spec = PBEKeySpec(password.toCharArray(), salt, iterations, keyLength * 8)
            val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val key = factory.generateSecret(spec).encoded
            spec.clearPassword()
            key.toHex()
        }

        Function("generateSalt") { byteLength: Int ->
            val bytes = ByteArray(byteLength)
            secureRandom.nextBytes(bytes)
            Base64.encodeToString(bytes, Base64.NO_PADDING or Base64.NO_WRAP)
        }

        // ---------------------------------------------------------------
        // AES-256-GCM (string plaintext — for vault entries)
        // ---------------------------------------------------------------

        Function("encryptAesGcm") { plaintext: String, keyHex: String ->
            val key = SecretKeySpec(keyHex.hexToBytes(), "AES")
            val nonce = ByteArray(12)
            secureRandom.nextBytes(nonce)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, nonce))
            val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

            mapOf(
                "encrypted_data" to ciphertext.toHex(),
                "nonce" to nonce.toHex()
            )
        }

        Function("decryptAesGcm") { ciphertextHex: String, nonceHex: String, keyHex: String ->
            val key = SecretKeySpec(keyHex.hexToBytes(), "AES")
            val nonce = nonceHex.hexToBytes()
            val ciphertext = ciphertextHex.hexToBytes()

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, nonce))
            String(cipher.doFinal(ciphertext), Charsets.UTF_8)
        }

        // ---------------------------------------------------------------
        // AES-256-GCM raw (hex plaintext — for shared vault keys)
        // ---------------------------------------------------------------

        Function("encryptAesGcmRaw") { plaintextHex: String, keyHex: String ->
            val key = SecretKeySpec(keyHex.hexToBytes(), "AES")
            val nonce = ByteArray(12)
            secureRandom.nextBytes(nonce)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, nonce))
            val ciphertext = cipher.doFinal(plaintextHex.hexToBytes())

            mapOf(
                "encrypted_data" to ciphertext.toHex(),
                "nonce" to nonce.toHex()
            )
        }

        Function("decryptAesGcmRaw") { ciphertextHex: String, nonceHex: String, keyHex: String ->
            val key = SecretKeySpec(keyHex.hexToBytes(), "AES")
            val nonce = nonceHex.hexToBytes()
            val ciphertext = ciphertextHex.hexToBytes()

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, nonce))
            cipher.doFinal(ciphertext).toHex()
        }

        // ---------------------------------------------------------------
        // X25519 key exchange
        // ---------------------------------------------------------------

        Function("generateX25519Keypair") {
            if (Build.VERSION.SDK_INT >= 31) {
                val kpg = KeyPairGenerator.getInstance("X25519")
                val pair = kpg.generateKeyPair()
                // Extract raw 32-byte keys from the encoded forms
                val pubRaw = extractX25519PublicRaw(pair.public.encoded)
                val privRaw = extractX25519PrivateRaw(pair.private.encoded)
                mapOf(
                    "public_key" to pubRaw.toHex(),
                    "private_key" to privRaw.toHex()
                )
            } else {
                // Fallback: pure implementation for older Android
                val privateKey = ByteArray(32)
                secureRandom.nextBytes(privateKey)
                X25519.clampPrivateKey(privateKey)
                val publicKey = X25519.publicFromPrivate(privateKey)
                mapOf(
                    "public_key" to publicKey.toHex(),
                    "private_key" to privateKey.toHex()
                )
            }
        }

        Function("x25519DeriveSharedKey") { privateKeyHex: String, publicKeyHex: String ->
            if (Build.VERSION.SDK_INT >= 31) {
                val privBytes = privateKeyHex.hexToBytes()
                val pubBytes = publicKeyHex.hexToBytes()
                val privEncoded = wrapX25519Private(privBytes)
                val pubEncoded = wrapX25519Public(pubBytes)

                val privKey = KeyFactory.getInstance("X25519")
                    .generatePrivate(PKCS8EncodedKeySpec(privEncoded))
                val pubKey = KeyFactory.getInstance("X25519")
                    .generatePublic(X509EncodedKeySpec(pubEncoded))

                val ka = KeyAgreement.getInstance("X25519")
                ka.init(privKey)
                ka.doPhase(pubKey, true)
                ka.generateSecret().toHex()
            } else {
                val privBytes = privateKeyHex.hexToBytes()
                val pubBytes = publicKeyHex.hexToBytes()
                X25519.sharedSecret(privBytes, pubBytes).toHex()
            }
        }
    }

    companion object {
        private fun padBase64(b64: String): String {
            val r = b64.length % 4
            return if (r == 0) b64 else b64 + "=".repeat(4 - r)
        }

        // X25519 SubjectPublicKeyInfo header (RFC 8410)
        private val X25519_SPKI_PREFIX = byteArrayOf(
            0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00
        )

        // X25519 PKCS8 header (RFC 8410)
        private val X25519_PKCS8_PREFIX = byteArrayOf(
            0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e,
            0x04, 0x22, 0x04, 0x20
        )

        fun wrapX25519Public(raw32: ByteArray): ByteArray =
            X25519_SPKI_PREFIX + raw32

        fun wrapX25519Private(raw32: ByteArray): ByteArray =
            X25519_PKCS8_PREFIX + raw32

        fun extractX25519PublicRaw(encoded: ByteArray): ByteArray =
            encoded.copyOfRange(encoded.size - 32, encoded.size)

        fun extractX25519PrivateRaw(encoded: ByteArray): ByteArray =
            encoded.copyOfRange(encoded.size - 32, encoded.size)
    }
}

// Extension functions
private fun ByteArray.toHex(): String = joinToString("") { "%02x".format(it) }

private fun String.hexToBytes(): ByteArray {
    val len = length
    val data = ByteArray(len / 2)
    for (i in 0 until len step 2) {
        data[i / 2] = ((Character.digit(this[i], 16) shl 4) + Character.digit(this[i + 1], 16)).toByte()
    }
    return data
}
