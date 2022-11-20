const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
// More info at:
// - https://github.com/auth0/node-jsonwebtoken
// - https://jwt.io/#libraries

require('dotenv').config();

const database = {
    users: {}
};

const HOST_NAME = 'localhost';
const PORT = 3001;
const SERVER_URI = `http://${HOST_NAME}:${PORT}`;

// System variables where client credentials are stored
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/tasks'];
const SCOPES_URL = SCOPES.join('%20');

// Callback URL configured during Client registration in OIDC provider
const CALLBACK = 'callback';
const REDIRECT_URI = `${SERVER_URI}/${CALLBACK}`;

const TOKEN_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/token';
const TASKS_LISTS_ENDPOINT = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists'

const app = express();
app.use(cookieParser());

app.get('/', (req, resp) => {
    const { token } = req.cookies;

    // Validate token
    if (!token) {
        resp.send('<a href=/login>Login with Google Account</a>');
        return;
    }

    jwt.verify(token, JWT_SECRET, async (err, data) => {
        if (err) resp.send('Invalid token');

        const user = database.users[data.email];

        console.log("user", user);
        if (!user) {
            resp.send('<a href=/login>Login with Google Account</a>');
            return;
        }

        const response = await axios.get(
            TASKS_LISTS_ENDPOINT,
            {
                headers: {
                    "Authorization": `Bearer ${user.access_token}`
                }
            }
        );

        const taskLists = response.data.items;

        let html = '<ul>';
        for (const taskList of taskLists) {
            const task = await axios.get(
                taskList.selfLink,
                {
                    headers: {
                        "Authorization": `Bearer ${user.access_token}`
                    }
                }
            );

            html += `<li>${taskList.title}</li>`;
            console.log(task);
        };
        html += '</ul>';

        resp.send(html);
    });
});

// More information at: https://developers.google.com/identity/protocols/OpenIDConnect

app.get('/login', (req, resp) => {
    resp.redirect(302,
        'https://accounts.google.com/o/oauth2/v2/auth?' // Authorization endpoint
        + `client_id=${CLIENT_ID}&`                     // Client id
        + `scope=${SCOPES_URL}&`                        // OpenID scope "openid email"
        + 'state=value-based-on-user-session&'          // Used to check if the user-agent requesting login is the same making the request to the callback URL, more info at https://www.rfc-editor.org/rfc/rfc6749#section-10.12
        + 'response_type=code&'                         // Responde_type for "authorization code grant"
        + `redirect_uri=${REDIRECT_URI}`)               // Redirect uri used to register RP
});


app.get(`/${CALLBACK}`, (req, resp) => {
    // TODO: check if 'state' is correct for this session

    console.log('Making request to token endpoint');
    // content-type: application/x-www-form-urlencoded (URL-Encoded Forms)
    const form = new FormData();
    form.append('code', req.query.code);
    form.append('client_id', CLIENT_ID);
    form.append('client_secret', CLIENT_SECRET);
    form.append('redirect_uri', `${SERVER_URI}/${CALLBACK}`);
    form.append('grant_type', 'authorization_code');

    axios.post(TOKEN_ENDPOINT, form, { headers: form.getHeaders() })
        .then(function (response) {
            // Obtain JWT Payload by decoding id_token (method decode does not verify signature)
            const jwt_payload = jwt.decode(response.data.id_token);
            console.log(jwt_payload);

            const access_token = response.data.access_token;
            const email = jwt_payload.email;
            console.log("email", email);

            database.users[email] = {
                email: email,
                access_token: access_token
            };

            // Generate a random session cookie based on the user email
            jwt.sign({ email: email }, JWT_SECRET, { algorithm: "HS256" }, (err, token) => {
                if (err) {
                    console.log(err);
                    resp.send('Error generating token');
                    return;
                }

                // Set session cookie
                resp.cookie('token', token, { maxAge: 900000, httpOnly: true });
                resp.redirect('/');
            });

        })
        .catch(function (error) {
            console.log(error);
            resp.send();
        });
});

app.listen(PORT, (err) => {
    if (err) return console.log('Something bad happened', err);

    console.log(`Server is listening on ${PORT}`);
});
