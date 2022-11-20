package pt.isel.seginf.trab2.ex6

import java.io.PrintWriter
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory

private const val HOST = "www.secure-server.edu"
private const val PORT = 4433

/**
 * Entry point for the client application that establishes a connection to the https server, using JCA.
 */
fun main() {
    // Set truststore
    System.setProperty("javax.net.ssl.trustStore", "src/main/kotlin/pt/isel/seginf/trab2/ex6/truststore.jks")
    System.setProperty("javax.net.ssl.trustStorePassword", "changeit")

    // Create a socket factory and socket
    val sslFactory: SSLSocketFactory = HttpsURLConnection.getDefaultSSLSocketFactory()
    val sslSocket: SSLSocket = sslFactory.createSocket(HOST, PORT) as SSLSocket

    sslSocket.use { socket ->
        // Establish connection
        socket.startHandshake()

        // Create a writer to send data to the server
        PrintWriter(sslSocket.outputStream.bufferedWriter()).use { writer ->
            // Send a message to the server
            writer.print("GET / HTTP/1.1\n\n")
            writer.flush()

            // Read the response from the server
            sslSocket.inputStream.bufferedReader().use { reader ->
                reader.forEachLine { println(it) }
            }
        }
    }
}
