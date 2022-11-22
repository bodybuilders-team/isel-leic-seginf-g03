/**
 * Returns an object with a headers property containing an object with the Authorization header set to the Bearer token.
 *
 * @param {string} bearerToken the bearer token
 * @returns {object} the headers object
 */
function authHeaders(bearerToken) {
    return {
        headers: {
            "Authorization": `Bearer ${bearerToken}`
        }
    };
}

module.exports = {authHeaders};
