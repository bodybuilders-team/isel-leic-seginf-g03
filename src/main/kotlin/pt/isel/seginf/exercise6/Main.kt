package pt.isel.seginf.exercise6

private const val MODE_INDEX = 0
private const val ENCRYPT_MODE = "-enc"
private const val DECRYPT_MODE = "-dec"

private const val ENCRYPT_ARGS_COUNT = 8
private const val DECRYPT_ARGS_COUNT = 7

private const val FILE_PATH_INDEX = 1
private const val CERTIFICATE_PATH_INDEX = 2
private const val TRUSTED_CAS_PATH_INDEX = 3
private const val TRUSTED_CAS_KEYSTORE_PASSWORD_INDEX = 4
private const val INT_CAS_PATH_INDEX = 5
private const val ENCRYPTED_FILE_PATH_INDEX = 6
private const val ENCRYPTED_SYMMETRIC_KEY_PATH_INDEX = 7

private const val ENCRYPTED_FILE_PATH_INDEX_DECRYPT = 1
private const val ENCRYPTED_SYMMETRIC_KEY_PATH_INDEX_DECRYPT = 2
private const val KEYSTORE_PATH_INDEX_DECRYPT = 3
private const val KEYSTORE_PASSWORD_INDEX_DECRYPT = 4
private const val KEYSTORE_KEY_ALIAS_INDEX_DECRYPT = 5
private const val DECRYPTED_FILE_PATH_INDEX_DECRYPT = 6

/**
 * Entry point for the application that encrypts and decrypts files using hybrid cryptography.
 *
 * The first argument is the mode to run the application in. Either "-enc" for encryption or "-dec" for decryption.
 * The remaining arguments depend on the mode:
 *
 * For encryption:
 * 1. The path to the file to encrypt
 * 2. The path to the certificate to encrypt the symmetric key with
 * 3. The path to the file containing the trusted CAs keystore
 * 4. The password for the trusted CAs keystore
 * 5. The path to the directory containing the intermediate CAs files
 * 6. The path to the file to write the encrypted file to
 * 7. The path to the file to write the encrypted symmetric key to
 *
 * For decryption:
 * 1. The path to the encrypted file
 * 2. The path to the encrypted symmetric key
 * 3. The path to the keystore
 * 4. The password for the keystore
 * 5. The alias of the key in the keystore
 * 6. The path to the decrypted file
 *
 * @param args the arguments to the application
 */
fun main(args: Array<String>) {
    if (args.isEmpty()) {
        showHelp()
        return
    }

    when (args[MODE_INDEX]) {
        ENCRYPT_MODE -> {
            if (args.size != ENCRYPT_ARGS_COUNT) {
                showHelp()
                return
            }

            encrypt(
                filePath = args[FILE_PATH_INDEX],
                certificateFilePath = args[CERTIFICATE_PATH_INDEX],
                trustedCAsPath = args[TRUSTED_CAS_PATH_INDEX],
                trustedCAsKeyStorePassword = args[TRUSTED_CAS_KEYSTORE_PASSWORD_INDEX],
                intCAsPath = args[INT_CAS_PATH_INDEX],
                encryptedFilePath = args[ENCRYPTED_FILE_PATH_INDEX],
                encryptedSymmetricKeyFilePath = args[ENCRYPTED_SYMMETRIC_KEY_PATH_INDEX]
            )
        }

        DECRYPT_MODE -> {
            if (args.size != DECRYPT_ARGS_COUNT) {
                showHelp()
                return
            }

            decrypt(
                encryptedFilePath = args[ENCRYPTED_FILE_PATH_INDEX_DECRYPT],
                encryptedSymmetricKeyFilePath = args[ENCRYPTED_SYMMETRIC_KEY_PATH_INDEX_DECRYPT],
                keystoreFilePath = args[KEYSTORE_PATH_INDEX_DECRYPT],
                keystorePassword = args[KEYSTORE_PASSWORD_INDEX_DECRYPT],
                keystoreKeyAlias = args[KEYSTORE_KEY_ALIAS_INDEX_DECRYPT],
                decryptedFilePath = args[DECRYPTED_FILE_PATH_INDEX_DECRYPT]
            )
        }

        else -> showHelp()
    }
}

/**
 * Shows the help text for the application.
 */
fun showHelp() {
    println(
        """
        |Usage: 
        |   -enc <file_path> <certificate_file_path> <trusted_cas_path> <trusted_cas_keystore_password> <int_cas_path> <encrypted_file_path> <encrypted_symmetric_key_path>
        |   -dec <encrypted_file_path> <encrypted_symmetric_key_file_path> <keystore_file_path> <keystore_password> <keystore_alias> <decrypted_file_path>
        """.trimMargin()
    )
}
