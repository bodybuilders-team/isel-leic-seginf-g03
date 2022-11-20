package pt.isel.seginf.trab1.ex6 // ktlint-disable filename

import java.io.File
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate

private const val CERTIFICATE_FILE_EXTENSION = "cer"

/**
 * Splits a byte array at a given position.
 *
 * @receiver the byte array to split
 * @param i the position to split the array
 *
 * @return the two arrays
 */
fun ByteArray.splitAt(i: Int): Pair<ByteArray, ByteArray> =
    Pair(
        copyOfRange(fromIndex = 0, toIndex = i),
        copyOfRange(fromIndex = i, toIndex = size)
    )

/**
 * Gets the certificates from a directory.
 *
 * @receiver the certificate factory
 * @param directoryPath the path to the directory
 *
 * @return the list of certificates
 */
fun CertificateFactory.getCertificates(directoryPath: String): List<X509Certificate> {
    val certificates = mutableListOf<X509Certificate>()

    File(directoryPath).listFiles()
        ?.filter { it.extension == CERTIFICATE_FILE_EXTENSION }
        ?.forEach { file -> certificates.add(this.generateCertificate(file.inputStream()) as X509Certificate) }

    return certificates
}
