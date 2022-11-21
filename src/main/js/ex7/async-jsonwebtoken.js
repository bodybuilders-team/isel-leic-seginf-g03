const jwt = require('jsonwebtoken');

const oldSign = jwt.sign;
const oldVerify = jwt.verify;

jwt.sign = (payload, secret, options) =>
	new Promise((resolve, reject) => {
		oldSign(payload, secret, options, (err, token) => {
			if (err) {
				reject(err);
			} else {
				resolve(token);
			}
		});
	});

jwt.verify = (token, secret, options) =>
	new Promise((resolve, reject) => {
		oldVerify(token, secret, options, (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});

module.exports = jwt;