import java.io.BufferedInputStream
import java.io.FileInputStream
import java.security.DigestInputStream
import java.security.MessageDigest

private const val HASH_FUNCTION_INDEX = 0
private const val FILE_PATH_INDEX = 1
private const val BUFFER_SIZE = 1024

/**
 * Entry point for the application to generate file hashes.
 *
 * Requires two arguments:
 * 1. The hash function to use (e.g. MD5, SHA-1, SHA-256, etc.)
 * 2. The path to the file to hash
 *
 * @param args The arguments to the application
 */
fun main(args: Array<String>) {
    val hashFunction = args[HASH_FUNCTION_INDEX]
    val file = args[FILE_PATH_INDEX]

    val digestInputStream = DigestInputStream(
        BufferedInputStream(FileInputStream(file)),
        MessageDigest.getInstance(hashFunction)
    )

    val buffer = ByteArray(BUFFER_SIZE)
    while (true) {
        val readCount: Int = digestInputStream.read(buffer)
        if (readCount < 0) break
    }

    digestInputStream.messageDigest
        .digest()
        .joinToString("") { "%02x".format(it) }
        .also { println(it) }
}
