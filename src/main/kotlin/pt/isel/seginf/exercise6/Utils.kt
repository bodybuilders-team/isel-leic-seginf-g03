package pt.isel.seginf.exercise6 // ktlint-disable filename

import java.io.File
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

/**
 * Splits a byte array at a given position.
 *
 * @param i The position to split the array.
 * @return The two arrays.
 */
fun ByteArray.splitAt(i: Int): Pair<ByteArray, ByteArray> =
    Pair(copyOfRange(0, i), copyOfRange(i, size))

/**
 * Gets the certificates from a directory.
 *
 * @param directoryPath The path to the directory.
 * @return The list of certificates.
 */
fun CertificateFactory.getCertificates(directoryPath: String): List<X509Certificate> {
    val certificates = mutableListOf<X509Certificate>()

    File(directoryPath).listFiles()
        ?.filter { it.extension == "cer" }
        ?.forEach { file -> certificates.add(this.generateCertificate(file.inputStream()) as X509Certificate) }

    return certificates
}
