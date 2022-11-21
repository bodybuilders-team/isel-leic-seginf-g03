const express = require('express');
const axios = require('axios');
const jwt = require('./utils/async-jsonwebtoken'); // More info at: https://github.com/auth0/node-jsonwebtoken ; https://jwt.io/#libraries
const { getBearerHeaders } = require('./utils/utils');
const FormData = require('form-data');
const to = require('await-to-js').default;
const fs = require('fs');

require('dotenv').config();
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const DEV_MODE = config.DEV_MODE
const DEV_MODE_STATIC_URL = config.DEV_MODE_STATIC_URL;

const SCHEME = config.USE_HTTPS ? 'https' : 'http';
const SERVER_URI = `${SCHEME}://${DEV_MODE ? config.DEV_MODE_HOSTNAME : config.HOSTNAME}`;

const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/tasks'];
const SCOPES_URL = SCOPES.join('%20');

// Callback URL configured during Client registration in OIDC provider
const REDIRECT_ENDPOINT = '/oauth2/redirect/google';
const REDIRECT_URI = `${SERVER_URI}/api${REDIRECT_ENDPOINT}`;

// System variables where client credentials are stored
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;


const TOKEN_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/token';

const TOKEN_COOKIE_KEY = 'token';
const USERID_COOKIE_KEY = 'user_id';

module.exports = async function (database) {
    const { jwtValidateMw } = await require('./middleware')(database);

    const taskLists = await require('./tasklists')(database);
    const api = express.Router();

    api.use('/taskLists', taskLists)

    api.get('/profile', jwtValidateMw, (req, res) => {
        console.log("Received request for profile from user: ", req.user.email);

        const user = req.user;

        res.json({
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            picture: user.picture
        });

    })

    // More information at: https://developers.google.com/identity/protocols/OpenIDConnect

    api.get('/login/google', (req, res) => {
        console.log('Received login request, redirecting to Google login page');
        res.redirect(
            'https://accounts.google.com/o/oauth2/v2/auth?' // Authorization endpoint
            + `client_id=${CLIENT_ID}&`                     // Client id
            + `scope=${SCOPES_URL}&`                        // OpenID scope "openid email"
            + 'state=value-based-on-user-session&'          // Used to check if the user-agent requesting login is the same making the request to the callback URL, more info at https://www.rfc-editor.org/rfc/rfc6749#section-10.12
            + 'response_type=code&'                         // Response_type for "authorization code grant"
            + `redirect_uri=${REDIRECT_URI}`)               // Redirect uri used to register RP
    });


    api.get(REDIRECT_ENDPOINT, async (req, res) => {
        console.log(`Received redirect from OIDC provider with code: ${req.query.code}`);
        // TODO: check if 'state' is correct for this session
        const code = req.query.code;

        if (!code)
            return res.status(400).send('Bad request');

        // content-type: application/x-www-form-urlencoded (URL-Encoded Forms)
        const form = new FormData();
        form.append('code', code);
        form.append('client_id', CLIENT_ID);
        form.append('client_secret', CLIENT_SECRET);
        form.append('redirect_uri', REDIRECT_URI);
        form.append('grant_type', 'authorization_code');

        const [tokenReqErr, tokenRes] = await to(axios.post(
            TOKEN_ENDPOINT, form, { headers: form.getHeaders() }
        ));

        if (tokenReqErr) {
            console.log(tokenReqErr);
            return res.status(500).send('Error fetching token');
        }

        // Obtain JWT Payload by decoding id_token (method decode does not verify signature)
        const jwtPayload = jwt.decode(tokenRes.data.id_token);

        let user = database.users[jwtPayload.sub];
        if (!user) {
            const accessToken = tokenRes.data.access_token;

            console.log('Fetching user info');
            const [err, userInfoRes] = await to(
                axios.get("https://openidconnect.googleapis.com/v1/userinfo", getBearerHeaders(accessToken)))

            if (err) {
                console.log(err.response.data);
                return res.status(500).send('Error fetching user info');
            }
            const userInfo = userInfoRes.data;

            user = {
                user_id: userInfo.sub,
                email: userInfo.email,
                access_token: accessToken,
                picture: userInfo.picture,
                name: userInfo.name,
                role: 'free'
            };

            database.users[user.user_id] = user;
        }


        // Generate a random session cookie based on the user email
        const [tokenErr, token] = await to(
            jwt.sign({ user_id: user.user_id }, JWT_SECRET, { algorithm: "HS256" })
        );

        if (tokenErr)
            return res.status(500).send('Error generating token');

        // Set session cookie
        res.cookie(TOKEN_COOKIE_KEY, token, {
            maxAge: 60 * 60 * 1000, // 1 hour
            httpOnly: true,
            secure: true,
            sameSite: true
        });

        // Set user_id cookie in localhost

        res.cookie(USERID_COOKIE_KEY, user.user_id);

        res.redirect(!DEV_MODE ? '/' : DEV_MODE_STATIC_URL);
    });

    api.post('/logout', jwtValidateMw, (req, res) => {
        const token = req.cookies.token;
        console.log(`Received logout request for user: ${req.cookies.user_id}`);

        // Add token to blacklist
        database.revokedTokens[token] = true;

        res.clearCookie(TOKEN_COOKIE_KEY);
        res.clearCookie(USERID_COOKIE_KEY);
        res.redirect(!DEV_MODE ? '/' : DEV_MODE_STATIC_URL);
    });

    api.post('/upgrade', jwtValidateMw, (req, res) => {
        const user = req.user;
        console.log(`Received upgrade request for user: ${user.email}`);

        if (user.role === 'free') {
            user.role = 'premium';
            return res.json({ message: "User upgraded successfully from 'free' to premium" });
        }
        else if (user.role === 'premium') {
            user.role = 'admin';
            return res.json({ message: "User upgraded successfully from 'premium' to 'admin'" });
        }
    });

    return api;
};
