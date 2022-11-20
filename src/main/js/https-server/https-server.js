const https = require("https");
const express = require("express");
const fs = require('fs');

const PORT = 4433;
const app = express();

const clientAuth = false;

// Get request for resource /
app.get("/", function (req, res) {
    console.log(
        req.socket.remoteAddress
        + ' ' + (clientAuth ? (req.socket.getPeerCertificate().subject.CN) : '')
        + ' ' + req.method
        + ' ' + req.url
        + ' ' + req.httpVersion
    );

    res.send("<html lang=\"en\"><body><h1>Secure Hello World with node.js</h1></body></html>");
});

// Configure TLS handshake
const options = {
    cert: fs.readFileSync('./certificates/secure-server-certificate.pem'),
    key: fs.readFileSync('./certificates/secure-server-privatekey.pem'),
    ca: fs.readFileSync('./certificates/CA2.pem'),
    requestCert: clientAuth,
    rejectUnauthorized: clientAuth
};

// Create HTTPS server
https.createServer(options, app)
    .listen(PORT, function (req, res) {
            console.log("Server started at port " + PORT);
        }
    );
