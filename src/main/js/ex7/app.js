const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('./async-jsonwebtoken');
const FormData = require('form-data');
const to = require('./await-to');
// import path
const path = require('path');
const https = require('https');
const { getBearerHeaders } = require('./utils');
const fs = require('fs');

// More info at:
// - https://github.com/auth0/node-jsonwebtoken
// - https://jwt.io/#libraries


require('dotenv').config();

const database = {
    users: {},
    revokedTokens: {}
};

const HOST_NAME = 'www.secure-server.edu';
const PORT = 443;
const SERVER_URI = `https://${HOST_NAME}`;

// System variables where client credentials are stored
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/tasks'];
const SCOPES_URL = SCOPES.join('%20');

// Callback URL configured during Client registration in OIDC provider
const REDIRECT_ENDPOINT = '/oauth2/redirect/google';
const REDIRECT_URI = `${SERVER_URI}/api${REDIRECT_ENDPOINT}`;

const TOKEN_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/token';
const TASKS_API_ENDPOINT = 'https://tasks.googleapis.com/tasks/v1'
const TASKS_LISTS_ENDPOINT = `${TASKS_API_ENDPOINT}/users/@me/lists`

async function jwtValidateMw(req, res, next) {
    const token = req.cookies.token;
    console.log("Token: " + token);
    if (!token) {
        res.clearCookie('token');
        res.clearCookie('user_id');
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const isRevoked = database.revokedTokens[token];

    if (isRevoked) {
        res.clearCookie('token');
        res.clearCookie('user_id');
        return res.status(401).send('Unauthorized');
    }

    const [tokenVerifyErr, tokenData] = await to(jwt.verify(token, JWT_SECRET))

    if (tokenVerifyErr) {
        res.clearCookie('token');
        res.clearCookie('user_id');
        return res.status().send('Invalid token');
    }

    const user = database.users[tokenData.user_id];
    console.log("User: " + user);

    if (!user) {
        res.clearCookie('token');
        res.clearCookie('user_id');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
}

const app = express();
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'client', 'build')));

api = express.Router();

api.get('/tasks', jwtValidateMw, async (req, res) => {
    console.log("Received request for tasks from user: ", req.user.email);
    const user = req.user;
    
    const { taskListId } = req.query;

    if (!taskListId)
        return res.status(400).json({ message: 'Bad request' });

    const [tasksErr, tasksResponse] = await to(axios.get(
        `${TASKS_API_ENDPOINT}/lists/${taskListId}/tasks`,
        getBearerHeaders(user.access_token)
    ))

    if (tasksErr)
        return res.status(500).send("Error fetching tasks");

    const tasks = tasksResponse.data.items.map(task => {
        return {
            id: task.id,
            title: task.title,
            notes: task.notes,
            completed: task.status === 'completed',
            due: task.due
        }
    });

    res.json(tasks);
});

api.get('/taskLists', jwtValidateMw, async (req, res) => {
    console.log("Received request for tasks from user: ", req.user.email);
    const user = req.user;

    const [tasksErr, taskListsResponse] = await to(axios.get(
        TASKS_LISTS_ENDPOINT, getBearerHeaders(user.access_token)
    ));

    if (tasksErr) return res.status(500).send('Error fetching task lists');

    const taskLists = taskListsResponse.data.items.map(taskList => {
        return {
            id: taskList.id,
            title: taskList.title
        }
    });

    res.json(taskLists);
});

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


api.get(`${REDIRECT_ENDPOINT}`, async (req, res) => {
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
    form.append('redirect_uri', `${SERVER_URI}/api${REDIRECT_ENDPOINT}`);
    form.append('grant_type', 'authorization_code');

    const [tokenReqErr, tokenRes] = await to(axios.post(TOKEN_ENDPOINT, form, { headers: form.getHeaders() }))

    if (tokenReqErr) {
        console.log(tokenReqErr);
        return res.status(500).send('Error fetching token');
    }

    // Obtain JWT Payload by decoding id_token (method decode does not verify signature)
    const jwt_payload = jwt.decode(tokenRes.data.id_token);

    let user = database.users[jwt_payload.sub];
    if (!user) {
        const access_token = tokenRes.data.access_token;

        console.log('Fetching user info');
        const [err, userInfoRes] = await to(axios.get("https://openidconnect.googleapis.com/v1/userinfo", getBearerHeaders(access_token)))
        if (err) {
            console.log(err.response.data);
            return res.status(500).send('Error fetching user info');
        }
        const userInfo = userInfoRes.data;

        user = {
            user_id: userInfo.sub,
            email: userInfo.email,
            access_token: access_token,
            profilePicture: userInfo.picture,
            name: userInfo.name
        };

        database.users[user.user_id] = user
    }


    // Generate a random session cookie based on the user email
    const [tokenErr, token] = await to(jwt.sign({ user_id: user.user_id }, JWT_SECRET, { algorithm: "HS256" }))

    if (tokenErr)
        return res.status(500).send('Error generating token');

    // Set session cookie
    res.cookie('token', token, {
        maxAge: 60 * 60 * 1000, // 1 hour
        httpOnly: true,
        secure: true,
        sameSite: true,
    });

    res.cookie('user_id', user.user_id)

    res.redirect('/');
});

api.post('/logout', jwtValidateMw, (req, res) => {
    const token = req.cookies.token;
    console.log(`Received logout request for user: ${req.cookies.user_id}`);

    //Add token to blacklist
    database.revokedTokens[token] = true;

    res.clearCookie('token');
    res.clearCookie('user_id');
    res.redirect('/');
});

app.use('/api', api);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
})

// Configure TLS handshake
const options = {
    cert: fs.readFileSync('./certificates/certificate.pem'),
    key: fs.readFileSync('./certificates/privatekey.pem'),
};

// Create HTTPS server
https.createServer(options, app)
    .listen(PORT, function (req, res) {
        console.log("Server started at port " + PORT);
    }
    );

