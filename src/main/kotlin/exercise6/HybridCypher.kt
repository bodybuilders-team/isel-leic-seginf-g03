package exercise6

import org.apache.commons.codec.binary.Base64InputStream
import org.apache.commons.codec.binary.Base64OutputStream
import java.io.File
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertificateFactory
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

const val MODE_INDEX = 0
const val SYMMETRIC_KEY_SIZE = 128

/**
 * Encrypts a file with a symmetric key and encrypts the symmetric key with a public key.
 *
 * @param filePath The path to the file to encrypt.
 * @param certificateFilePath The path to the certificate file.
 * @param encryptedFilePath The path to the encrypted file.
 * @param encryptedSymmetricKeyFilePath The path to the encrypted symmetric key file.
 */
fun encrypt(
    filePath: String,
    certificateFilePath: String,
    encryptedFilePath: String,
    encryptedSymmetricKeyFilePath: String
) {
    val file = File(filePath)
    val certificateFile = File(certificateFilePath)
    val encryptedFile = File(encryptedFilePath)
    val encryptedSymmetricKeyFile = File(encryptedSymmetricKeyFilePath)

    val keyGen = KeyGenerator.getInstance("AES").also { it.init(SYMMETRIC_KEY_SIZE) }
    val key: SecretKey = keyGen.generateKey()

    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")

    val ivSecureRandom = SecureRandom.getInstance("SHA1PRNG")

    val iv = ByteArray(cipher.blockSize)
    ivSecureRandom.nextBytes(iv)

    cipher.init(Cipher.ENCRYPT_MODE, key, IvParameterSpec(iv))

    CipherInputStream(file.inputStream(), cipher)
        .use { inputStream ->
            Base64OutputStream(encryptedFile.outputStream()).use { outputStream ->
                inputStream.copyTo(outputStream)
            }
        }

    // Encrypt symmetric key with public key
    val certificateFactory = CertificateFactory.getInstance("X.509")
    val certificate = certificateFactory.generateCertificate(certificateFile.inputStream())
    val publicKey = certificate.publicKey

    val rsaCipher = Cipher.getInstance("RSA").also { it.init(Cipher.ENCRYPT_MODE, publicKey) }

    val encryptedSymmetricKey = rsaCipher.doFinal(key.encoded + iv)

    encryptedSymmetricKeyFile.writeBytes(encryptedSymmetricKey)
}

/**
 * Decrypts a file with a symmetric key and decrypts the symmetric key with a private key.
 *
 * @param encryptedFilePath The path to the encrypted file.
 * @param encryptedSymmetricKeyFilePath The path to the encrypted symmetric key file.
 * @param keystoreFilePath The path to the keystore file.
 * @param keystorePassword The password of the keystore.
 * @param keystoreKeyAlias The alias of the key in the keystore.
 * @param decryptedFilePath The path to the decrypted file.
 */
fun decrypt(
    encryptedFilePath: String,
    encryptedSymmetricKeyFilePath: String,
    keystoreFilePath: String,
    keystorePassword: String,
    keystoreKeyAlias: String,
    decryptedFilePath: String
) {
    val encryptedFile = File(encryptedFilePath)
    val encryptedSymmetricKeyFile = File(encryptedSymmetricKeyFilePath)
    val keystoreFile = File(keystoreFilePath)
    val decryptedFile = File(decryptedFilePath)

    // Read private key from .pfx file (keystore) and decrypt symmetric key with it (RSA)
    val keyStore = KeyStore.getInstance("PKCS12")
    keyStore.load(keystoreFile.inputStream(), keystorePassword.toCharArray())

    val privateKey = keyStore.getKey(keystoreKeyAlias, keystorePassword.toCharArray())
    val rsaCipher = Cipher.getInstance("RSA").also { it.init(Cipher.DECRYPT_MODE, privateKey) }

    val encryptedSymmetricKey = encryptedSymmetricKeyFile.readBytes()
//    val symmetricKey = rsaCipher.doFinal(encryptedSymmetricKey)
    val (symmetricKey, iv) = rsaCipher.doFinal(encryptedSymmetricKey).splitAt(SYMMETRIC_KEY_SIZE / 8)

    // Decrypt file with symmetric key (AES)
    val secretKey = SecretKeySpec(symmetricKey, "AES")

    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding").also { it.init(Cipher.DECRYPT_MODE, secretKey, IvParameterSpec(iv)) }

    CipherOutputStream(decryptedFile.outputStream(), cipher).use { cipherOutputStream ->
        Base64InputStream(encryptedFile.inputStream()).use { inputStream ->
            inputStream.copyTo(cipherOutputStream)
        }
    }
}

private fun ByteArray.splitAt(i: Int): Pair<ByteArray, ByteArray> =
    Pair(copyOfRange(0, i), copyOfRange(i, size))
