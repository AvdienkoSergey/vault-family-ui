package expo.modules.vaultcrypto

/**
 * Pure Kotlin X25519 (Curve25519 Diffie-Hellman) implementation.
 * Used as fallback on Android < API 31.
 *
 * Based on RFC 7748 using the Montgomery ladder.
 * Field arithmetic in GF(2^255 - 19).
 */
object X25519 {

    private val P = java.math.BigInteger.TWO.pow(255).subtract(java.math.BigInteger.valueOf(19))
    private val A24 = java.math.BigInteger.valueOf(121666) // (486662 - 2) / 4

    fun clampPrivateKey(key: ByteArray) {
        key[0] = (key[0].toInt() and 248).toByte()
        key[31] = (key[31].toInt() and 127).toByte()
        key[31] = (key[31].toInt() or 64).toByte()
    }

    fun publicFromPrivate(privateKey: ByteArray): ByteArray {
        // Base point u = 9
        val basePoint = ByteArray(32)
        basePoint[0] = 9
        return scalarMult(privateKey, basePoint)
    }

    fun sharedSecret(privateKey: ByteArray, publicKey: ByteArray): ByteArray {
        return scalarMult(privateKey, publicKey)
    }

    private fun scalarMult(scalar: ByteArray, point: ByteArray): ByteArray {
        // Decode scalar (clamped)
        val k = scalar.copyOf()
        clampPrivateKey(k)

        // Decode u-coordinate (little-endian, clear top bit)
        val uBytes = point.copyOf()
        uBytes[31] = (uBytes[31].toInt() and 127).toByte()
        val u = decodeLe(uBytes)

        // Montgomery ladder
        var x1 = u
        var x2 = java.math.BigInteger.ONE
        var z2 = java.math.BigInteger.ZERO
        var x3 = u
        var z3 = java.math.BigInteger.ONE

        var swap = 0
        for (t in 254 downTo 0) {
            val byteIndex = t / 8
            val bitIndex = t % 8
            val kt = (k[byteIndex].toInt() shr bitIndex) and 1

            swap = swap xor kt
            // Conditional swap
            if (swap == 1) {
                val tmpX = x2; x2 = x3; x3 = tmpX
                val tmpZ = z2; z2 = z3; z3 = tmpZ
            }
            swap = kt

            val a = x2.add(z2).mod(P)
            val aa = a.multiply(a).mod(P)
            val b = x2.subtract(z2).mod(P)
            val bb = b.multiply(b).mod(P)
            val e = aa.subtract(bb).mod(P)
            val c = x3.add(z3).mod(P)
            val d = x3.subtract(z3).mod(P)
            val da = d.multiply(a).mod(P)
            val cb = c.multiply(b).mod(P)
            x3 = da.add(cb).mod(P).modPow(java.math.BigInteger.TWO, P)
            z3 = x1.multiply(da.subtract(cb).mod(P).modPow(java.math.BigInteger.TWO, P)).mod(P)
            x2 = aa.multiply(bb).mod(P)
            z2 = e.multiply(aa.add(A24.multiply(e).mod(P)).mod(P)).mod(P)
        }

        if (swap == 1) {
            val tmpX = x2; x2 = x3; x3 = tmpX
            val tmpZ = z2; z2 = z3; z3 = tmpZ
        }

        val result = x2.multiply(z2.modPow(P.subtract(java.math.BigInteger.TWO), P)).mod(P)
        return encodeLe(result)
    }

    private fun decodeLe(bytes: ByteArray): java.math.BigInteger {
        // Little-endian to BigInteger
        val reversed = bytes.reversedArray()
        return java.math.BigInteger(1, reversed)
    }

    private fun encodeLe(n: java.math.BigInteger): ByteArray {
        val bytes = n.toByteArray()
        // toByteArray is big-endian, may have leading zero
        val result = ByteArray(32)
        for (i in bytes.indices) {
            if (bytes.size - 1 - i < 32) {
                result[bytes.size - 1 - i] = bytes[i]
            }
        }
        return result
    }
}
