package pt.isel.seginf.exercise5

import java.io.File
import java.security.DigestInputStream
import java.security.MessageDigest

private const val HASH_FUNCTION_INDEX = 0
private const val FILE_PATH_INDEX = 1

/**
 * Entry point for the application to generate file hashes.
 *
 * Requires two arguments:
 * 1. The hash function to use (e.g. MD5, SHA-1, SHA-256, etc.)
 * 2. The path to the file to hash
 *
 * @param args the arguments to the application
 */
fun main(args: Array<String>) {
    val hashFunction = args[HASH_FUNCTION_INDEX]
    val file = args[FILE_PATH_INDEX]

    val digestInputStream = DigestInputStream(
        File(file).inputStream(),
        MessageDigest.getInstance(hashFunction)
    )

    @Suppress("ControlFlowWithEmptyBody")
    while (digestInputStream.read() != -1);

    digestInputStream
        .messageDigest
        .digest()
        .joinToString("") { "%02x".format(it) }
        .also { println(it) }
}
