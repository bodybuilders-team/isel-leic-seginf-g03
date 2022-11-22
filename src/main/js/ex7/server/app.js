const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors');

require('dotenv').config();
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const HOST_NAME = config.HOST_NAME;
const HTTP_PORT = config.HTTP_PORT;
const HTTPS_PORT = config.HTTPS_PORT;
const USE_HTTPS = config.USE_HTTPS;
const DEV_MODE = config.DEV_MODE;

/**
 * Initializes the Express app.
 *
 * @returns {Promise<void>} a promise that resolves when the app is initialized
 */
async function init() {
    const app = express();

    if (!DEV_MODE)
        app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
    else {
        const corsOptions = {
            origin: '*',
            optionSuccessStatus: 200
        };

        app.use(cors(corsOptions)); // Use this after the variable declaration
    }

    app.use(cookieParser());
    app.use(express.json());

    const database = {
        users: {},
        revokedTokens: {}
    };

    const api = await require('./api/api.js')(database);
    app.use('/api', api);

    if (!DEV_MODE)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
        });

    // Create an HTTP server
    http.createServer(app).listen(HTTP_PORT, HOST_NAME, function (req, res) {
        console.log("HTTP Server started at port " + HTTP_PORT);
    });

    if (USE_HTTPS) {
        // Configure TLS handshake
        const options = {
            cert: fs.readFileSync('./certificates/certificate.pem'),
            key: fs.readFileSync('./certificates/privatekey.pem'),
        };

        // Create HTTPS server
        https.createServer(options, app).listen(HTTPS_PORT, HOST_NAME, function (req, res) {
            console.log("HTTPS Server started at port " + HTTPS_PORT);
        });
    }
}

init().catch((err) => {
    console.log(err);
});
