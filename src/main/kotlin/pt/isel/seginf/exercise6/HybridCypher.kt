package pt.isel.seginf.exercise6

import org.apache.commons.codec.binary.Base64InputStream
import org.apache.commons.codec.binary.Base64OutputStream
import java.io.File
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertPathBuilder
import java.security.cert.CertStore
import java.security.cert.CertificateFactory
import java.security.cert.CollectionCertStoreParameters
import java.security.cert.PKIXBuilderParameters
import java.security.cert.X509CertSelector
import java.security.cert.X509Certificate
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec

private const val SYMMETRIC_KEY_SIZE = 128
private const val IV_SIZE = SYMMETRIC_KEY_SIZE
private const val IV_BYTES_SIZE = IV_SIZE / 8

/**
 * Encrypts a file with a symmetric key and encrypts the symmetric key with a public key.
 *
 * @param filePath The path to the file to encrypt.
 * @param certificateFilePath The path to the certificate file.
 * @param trustedCAsPath The path to the trusted CAs keystore.
 * @param trustedCAsKeyStorePassword The password for the trusted CAs keystore.
 * @param intCAsPath The path to the intermediate CAs files directory.
 * @param encryptedFilePath The path to the encrypted file.
 * @param encryptedSymmetricKeyFilePath The path to the encrypted symmetric key file.
 */
fun encrypt(
    filePath: String,
    certificateFilePath: String,
    trustedCAsPath: String,
    trustedCAsKeyStorePassword: String,
    intCAsPath: String,
    encryptedFilePath: String,
    encryptedSymmetricKeyFilePath: String
) {
    val file = File(filePath)
    val certificateFile = File(certificateFilePath)
    val encryptedFile = File(encryptedFilePath)
    val encryptedSymmetricKeyFile = File(encryptedSymmetricKeyFilePath)

    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")

    // Generate a random symmetric key
    val keyGenerator = KeyGenerator.getInstance("AES").also { it.init(SYMMETRIC_KEY_SIZE) }
    val key: SecretKey = keyGenerator.generateKey()

    // Generate a random IV
    val ivSecureRandom = SecureRandom.getInstance("SHA1PRNG")
    val iv = ByteArray(cipher.blockSize)
    ivSecureRandom.nextBytes(iv)

    cipher.init(Cipher.ENCRYPT_MODE, key, IvParameterSpec(iv))

    // Encrypt the file
    CipherInputStream(file.inputStream(), cipher).use { inputStream ->
        Base64OutputStream(encryptedFile.outputStream()).use { outputStream ->
            inputStream.copyTo(outputStream)
        }
    }

    // Encrypt symmetric key with public key
    val cerFactory = CertificateFactory.getInstance("X.509")
    val certificate = cerFactory.generateCertificate(certificateFile.inputStream()) as X509Certificate

    // Validate certificate chain
    val intCAs = cerFactory.getCertificates(intCAsPath)
    val trustedCAs = KeyStore.getInstance("JKS")
        .also {
            it.load(
                File(trustedCAsPath).inputStream(),
                trustedCAsKeyStorePassword.toCharArray()
            )
        }

    val certStore = CertStore.getInstance("Collection", CollectionCertStoreParameters(intCAs + certificate))

    val certBuilder = CertPathBuilder.getInstance("PKIX")
    val params = PKIXBuilderParameters(
        trustedCAs,
        X509CertSelector().also { it.certificate = certificate }
    ).also {
        it.isRevocationEnabled = false
        it.addCertStore(certStore)
    }

    certBuilder.build(params)

    val rsaCipher = Cipher.getInstance("RSA").also { it.init(Cipher.WRAP_MODE, certificate.publicKey) }
    encryptedSymmetricKeyFile.writeBytes(iv + rsaCipher.wrap(key))
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
    val rsaCipher = Cipher.getInstance("RSA").also { it.init(Cipher.UNWRAP_MODE, privateKey) }

    val encryptedSymmetricKey = encryptedSymmetricKeyFile.readBytes()

    // Change with wrap and unwrap
    val (iv, encryptedSymmetricSecretKey) = encryptedSymmetricKey.splitAt(IV_BYTES_SIZE)

    // Decrypt file with symmetric key (AES)
    val secretKey = rsaCipher.unwrap(encryptedSymmetricSecretKey, "AES", Cipher.SECRET_KEY)

    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
        .also { it.init(Cipher.DECRYPT_MODE, secretKey, IvParameterSpec(iv)) }

    // Decrypt file
    CipherOutputStream(decryptedFile.outputStream(), cipher).use { cipherOutputStream ->
        Base64InputStream(encryptedFile.inputStream()).use { inputStream ->
            inputStream.copyTo(cipherOutputStream)
        }
    }
}
