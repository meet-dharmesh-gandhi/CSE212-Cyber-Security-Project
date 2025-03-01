class ServerError extends Error {
	/**
	 * Used if some generic error pops up during execution of server
	 * @param {string} [message = "Internal Server Error!"]
	 * @param {number} [statusCode = 500]
	 * @param {string} [cause]
	 */
	constructor(
		message = "Internal Server Error!",
		statusCode = 500,
		cause = ""
	) {
		super(message);
		this.name = "ServerError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = ServerError;
