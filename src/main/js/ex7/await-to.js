
function to(promise) {
	return promise
		.then(res => [null, res])
		.catch(err => [err || true, null]);
}

module.exports = to;