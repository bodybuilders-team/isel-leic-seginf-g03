package exercise6

import org.apache.commons.codec.binary.Base64InputStream
import org.apache.commons.codec.binary.Base64OutputStream
import java.io.File
import java.security.KeyStore
import java.security.cert.CertificateFactory
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

const val MODE_INDEX = 0
const val SYMMETRIC_KEY_SIZE = 128

fun main(args: Array<String>) {
    if (args.isEmpty()) {
        showHelp()
        return
    }

    when (args[MODE_INDEX]) {
        "-enc" -> {
            if (args.size != 5) {
                showHelp()
                return
            }
            val filePath = args[1]
            val certificateFilePath = args[2]
            val encryptedFilePath = args[3]
            val encryptedSymmetricKeyFilePath = args[4]

            encrypt(filePath, certificateFilePath, encryptedFilePath, encryptedSymmetricKeyFilePath)
        }

        "-dec" -> {
            if (args.size != 7) {
                showHelp()
                return
            }

            val encryptedFilePath = args[1]
            val encryptedSymmetricKeyFilePath = args[2]
            val keystoreFilePath = args[3]
            val keystorePassword = args[4]
            val keystoreKeyAlias = args[5]
            val decryptedFilePath = args[6]

            decrypt(
                encryptedFilePath,
                encryptedSymmetricKeyFilePath,
                keystoreFilePath,
                keystorePassword,
                keystoreKeyAlias,
                decryptedFilePath
            )
        }

        else -> showHelp()
    }
}

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
    val rsaCipher = Cipher.getInstance("RSA")
    rsaCipher.init(Cipher.DECRYPT_MODE, privateKey)

    val encryptedSymmetricKey = encryptedSymmetricKeyFile.readBytes()
    val symmetricKey = rsaCipher.doFinal(encryptedSymmetricKey)

    // Decrypt file with symmetric key (AES)
    val secretKey = SecretKeySpec(symmetricKey, "AES")
    val cipher = Cipher.getInstance("AES")
    cipher.init(Cipher.DECRYPT_MODE, secretKey)

    CipherOutputStream(decryptedFile.outputStream(), cipher).use { cipherOutputStream ->
        Base64InputStream(encryptedFile.inputStream()).use { inputStream ->
            inputStream.copyTo(cipherOutputStream)
        }
    }
}

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

    val keyGen = KeyGenerator.getInstance("AES")
    keyGen.init(SYMMETRIC_KEY_SIZE)
    val key: SecretKey = keyGen.generateKey()

    val cipher = Cipher.getInstance("AES")
    cipher.init(Cipher.ENCRYPT_MODE, key)

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

    val rsaCipher = Cipher.getInstance("RSA")

    rsaCipher.init(Cipher.ENCRYPT_MODE, publicKey)

    val encryptedSymmetricKey = rsaCipher.doFinal(key.encoded)

    encryptedSymmetricKeyFile.writeBytes(encryptedSymmetricKey)
}

fun showHelp() {
    println(
        """
        |Usage: 
        |   -enc <file_path> <certificate_file_path> <encrypted_file_path> <output_encrypted_symmetric_key_file_path>
        |   -dec <encrypted_file_path> <encrypted_symmetric_key_file_path> <keystore_file_path> <keystore_password> <keystore_alias> <decrypted_file_path>
        """.trimMargin()
    )
}
