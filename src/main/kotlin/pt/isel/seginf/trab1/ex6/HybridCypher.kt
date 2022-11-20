package pt.isel.seginf.trab1.ex6

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
import javax.crypto.spec.GCMParameterSpec

private const val IV_BYTES_SIZE = 16 // AES BLOCK SIZE
private const val GCM_TAG_LENGTH = 128 // GCM TAG LENGTH
private const val AAD = "SEGINF" // ADDITIONAL AUTHENTICATED DATA

/**
 * Encrypts a file with a symmetric key and encrypts the symmetric key with a public key.
 *
 * @param filePath the path to the file to encrypt
 * @param certificateFilePath the path to the certificate file
 * @param trustedCAsPath the path to the trusted CAs keystore
 * @param trustedCAsKeyStorePassword the password for the trusted CAs keystore
 * @param intCAsPath the path to the intermediate CAs files directory
 * @param encryptedFilePath the path to the encrypted file
 * @param encryptedSymmetricKeyFilePath the path to the encrypted symmetric key file
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

    val cipher = Cipher.getInstance("AES/GCM/NoPadding")

    // Generate a random symmetric key
    val keyGenerator = KeyGenerator.getInstance("AES")
    val symmetricKey: SecretKey = keyGenerator.generateKey()

    // Generate a random IV
    val ivSecureRandom = SecureRandom.getInstance("SHA1PRNG")
    val iv = ByteArray(cipher.blockSize)
    ivSecureRandom.nextBytes(iv)

    cipher.init(
        /* opmode = */ Cipher.ENCRYPT_MODE,
        /* key = */ symmetricKey,
        /* params = */ GCMParameterSpec(GCM_TAG_LENGTH, iv)
    )
    cipher.updateAAD(AAD.toByteArray())

    // Encrypt the file with the symmetric key
    CipherInputStream(file.inputStream(), cipher).use { inputStream ->
        Base64OutputStream(encryptedFile.outputStream()).use { outputStream ->
            inputStream.copyTo(outputStream)
        }
    }

    // Obtain public key certificate
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
    val pkixParams = PKIXBuilderParameters(
        trustedCAs,
        X509CertSelector().also { it.certificate = certificate }
    ).also {
        it.isRevocationEnabled = false
        it.addCertStore(certStore)
    }

    certBuilder.build(pkixParams)

    // Encrypt symmetric key with public key
    val rsaCipher = Cipher.getInstance("RSA").also { it.init(Cipher.WRAP_MODE, certificate.publicKey) }
    val encryptedSymmetricKey = rsaCipher.wrap(symmetricKey)

    // Cipher file with symmetric key
    Base64OutputStream(encryptedSymmetricKeyFile.outputStream()).use { outputStream ->
        outputStream.write(iv + encryptedSymmetricKey)
    }
}

/**
 * Decrypts a file with a symmetric key and decrypts the symmetric key with a private key.
 *
 * @param encryptedFilePath the path to the encrypted file
 * @param encryptedSymmetricKeyFilePath the path to the encrypted symmetric key file
 * @param keystoreFilePath the path to the keystore file
 * @param keystorePassword the password of the keystore
 * @param keystoreKeyAlias the alias of the key in the keystore
 * @param decryptedFilePath the path to the decrypted file
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

    val encryptedSymmetricKey = Base64InputStream(encryptedSymmetricKeyFile.inputStream()).readBytes()

    // Change with wrap and unwrap
    val (iv, encryptedSymmetricSecretKey) = encryptedSymmetricKey.splitAt(IV_BYTES_SIZE)

    // Decrypt file with symmetric key (AES)
    val symmetricKey = rsaCipher.unwrap(encryptedSymmetricSecretKey, "AES", Cipher.SECRET_KEY)

    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(
        /* opmode = */ Cipher.DECRYPT_MODE,
        /* key = */symmetricKey,
        /* params = */ GCMParameterSpec(GCM_TAG_LENGTH, iv)
    )
    cipher.updateAAD(AAD.toByteArray())

    // Decrypt file
    CipherOutputStream(decryptedFile.outputStream(), cipher).use { cipherOutputStream ->
        Base64InputStream(encryptedFile.inputStream()).use { inputStream ->
            inputStream.copyTo(cipherOutputStream)
        }
    }
}
