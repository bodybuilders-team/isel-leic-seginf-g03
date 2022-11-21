
/**
 * Gets the bearer headers objec.
 * 
 * @param {string} bearerToken the bearer token
 * @returns {object} the headers object
 */
function getBearerHeaders(bearerToken) {
	return {
		headers: {
			"Authorization": `Bearer ${bearerToken}`
		}
	};
}

module.exports = { getBearerHeaders };
