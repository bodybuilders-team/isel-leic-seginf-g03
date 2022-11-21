const { newEnforcer } = require('casbin');
const to = require('await-to-js').default;
const jwt = require('./utils/async-jsonwebtoken'); // More info at: https://github.com/auth0/node-jsonwebtoken ; https://jwt.io/#libraries
const fs = require('fs');

const TOKEN_COOKIE_KEY = 'token';
const USERID_COOKIE_KEY = 'user_id';

module.exports = async function (database) {
	const enforcer = await newEnforcer('access_policy/rbac_model.conf', 'access_policy/rbac_policy.csv')

	/**
	 * Checks if the given token is revoked.
	 * 
	 * @param {string} token 
	 * @returns true if the token is revoked, false otherwise
	 */
	function isRevoked(token) {
		return database.revokedTokens[token] !== undefined;
	}

	/**
	 * Gets the user identified by the given user_id.
	 * 
	 * @param {*} user_id 
	 * @returns the user object if found, undefined otherwise
	 */
	function getUser(user_id) {
		return database.users[user_id];
	}

	function authorize(resource, action) {
		return async function (req, res, next) {
			const user = req.user;
			const authorized = await enforcer.enforce(user.role, resource, action);
			if (!authorized)
				return res.status(403).json({ message: 'Unauthorized' });
			next();
		}
	}

	/**
		 * Validates the JWT token present in the cookies of the request.
		 * 
		 * @param {Express.Request} req the request object
		 * @param {Express.Response} res the response object
		 * @param {*} next the next middleware function
		 */
	async function jwtValidateMw(req, res, next) {
		const token = req.cookies.token;
		console.log("Token:", token);

		/**
		 * Sends a 401 response to the client.
		 * 
		 * @param {string} message the message to be sent to the client
		 */
		function sendUnauthenticated(message) {
			res.clearCookie(TOKEN_COOKIE_KEY);
			res.clearCookie(USERID_COOKIE_KEY);
			res.status(401).json({ message });
		}

		if (!token)
			return sendUnauthenticated('No token present in cookies');

		if (isRevoked(token))
			return sendUnauthenticated('Token is revoked');

		const [tokenVerifyErr, tokenData] = await to(jwt.verify(token, process.env.JWT_SECRET));
		if (tokenVerifyErr)
			return sendUnauthenticated('Invalid token');

		const user = getUser(tokenData.user_id);

		if (!user)
			return sendUnauthenticated('User not found');

		req.user = user;
		next();
	}


	return { authorize, jwtValidateMw }
}