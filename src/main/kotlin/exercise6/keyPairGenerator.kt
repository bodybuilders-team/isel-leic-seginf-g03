package exercise6

import org.bouncycastle.asn1.oiw.OIWObjectIdentifiers
import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.asn1.x509.AlgorithmIdentifier
import org.bouncycastle.asn1.x509.AuthorityKeyIdentifier
import org.bouncycastle.asn1.x509.BasicConstraints
import org.bouncycastle.asn1.x509.Extension
import org.bouncycastle.asn1.x509.SubjectKeyIdentifier
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo
import org.bouncycastle.cert.X509ExtensionUtils
import org.bouncycastle.cert.X509v3CertificateBuilder
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.operator.DigestCalculator
import org.bouncycastle.operator.bc.BcDigestCalculatorProvider
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import java.io.File
import java.io.FileOutputStream
import java.math.BigInteger
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PublicKey
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.time.Duration
import java.time.Instant
import java.util.Date

fun main(args: Array<String>) {
    // Generate .pfx and .cer files
    val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
    keyPairGenerator.initialize(2048)
    val keyPair = keyPairGenerator.generateKeyPair()

    val keyStore = KeyStore.getInstance("PKCS12")
    keyStore.load(null, null)
    val certificate = generate(keyPair, "SHA256WithRSAEncryption", "test", 365)
    keyStore.setKeyEntry("key", keyPair.private, "password".toCharArray(), arrayOf(certificate))
    keyStore.store(FileOutputStream(File("./docs/key.pfx")), "password".toCharArray())

    // Generate .cer file
    val certificateFactory = CertificateFactory.getInstance("X.509")
    val certificateFile = File("./docs/certificate.cer")
    certificateFile.writeBytes(certificate.encoded)
}

/**
 * Generates a self signed certificate using the BouncyCastle lib.
 *
 * @param keyPair used for signing the certificate with PrivateKey
 * @param hashAlgorithm Hash function
 * @param cn Common Name to be used in the subject dn
 * @param days validity period in days of the certificate
 *
 * @return self-signed X509Certificate
 *
 */
fun generate(
    keyPair: KeyPair,
    hashAlgorithm: String,
    cn: String,
    days: Int
): X509Certificate {
    val now = Instant.now()
    val notBefore = Date.from(now)
    val notAfter = Date.from(now.plus(Duration.ofDays(days.toLong())))
    val contentSigner = JcaContentSignerBuilder(hashAlgorithm).build(keyPair.private)
    val x500Name = X500Name("CN=$cn")
    val certificateBuilder: X509v3CertificateBuilder = JcaX509v3CertificateBuilder(
        x500Name,
        BigInteger.valueOf(now.toEpochMilli()),
        notBefore,
        notAfter,
        x500Name,
        keyPair.public
    )
        .addExtension(Extension.subjectKeyIdentifier, false, createSubjectKeyId(keyPair.public))
        .addExtension(Extension.authorityKeyIdentifier, false, createAuthorityKeyId(keyPair.public))
        .addExtension(Extension.basicConstraints, true, BasicConstraints(true))
    return JcaX509CertificateConverter()
        .setProvider(BouncyCastleProvider()).getCertificate(certificateBuilder.build(contentSigner))
}

/**
 * Creates the hash value of the public key.
 *
 * @param publicKey of the certificate
 *
 * @return SubjectKeyIdentifier hash
 *
 */
private fun createSubjectKeyId(publicKey: PublicKey): SubjectKeyIdentifier {
    val publicKeyInfo: SubjectPublicKeyInfo = SubjectPublicKeyInfo.getInstance(publicKey.encoded)
    val digCalc: DigestCalculator = BcDigestCalculatorProvider().get(AlgorithmIdentifier(OIWObjectIdentifiers.idSHA1))
    return X509ExtensionUtils(digCalc).createSubjectKeyIdentifier(publicKeyInfo)
}

/**
 * Creates the hash value of the authority public key.
 *
 * @param publicKey of the authority certificate
 *
 * @return AuthorityKeyIdentifier hash
 *
 */
private fun createAuthorityKeyId(publicKey: PublicKey): AuthorityKeyIdentifier {
    val publicKeyInfo: SubjectPublicKeyInfo = SubjectPublicKeyInfo.getInstance(publicKey.encoded)
    val digCalc: DigestCalculator = BcDigestCalculatorProvider().get(AlgorithmIdentifier(OIWObjectIdentifiers.idSHA1))
    return X509ExtensionUtils(digCalc).createAuthorityKeyIdentifier(publicKeyInfo)
}
