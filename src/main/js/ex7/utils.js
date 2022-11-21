

function getBearerHeaders(bearer_token) {
	return {
		headers: {
			"Authorization": `Bearer ${bearer_token}`
		}
	}
}

module.exports = { getBearerHeaders };