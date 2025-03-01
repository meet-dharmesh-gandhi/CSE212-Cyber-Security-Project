class BadRequestError extends Error {
	/**
	 * Used when the request does not have required parameters
	 * @param {string} [message = "Bad request error!"]
	 * @param {number} [statusCode = 400]
	 * @param {string} [cause]
	 */
	constructor(message = "Bad request error!", statusCode = 400, cause = "") {
		super(message);
		this.name = "BadRequestError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = BadRequestError;
