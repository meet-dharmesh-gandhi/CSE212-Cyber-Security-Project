class UnauthorizedError extends Error {
	/**
	 * Used when access is required but the user is not authorized (all the pages except the sign up and sign in)
	 * @param {string} [message = "Unauthorized users not allowed!"]
	 * @param {number} [statusCode = 409]
	 * @param {string} [cause]
	 */
	constructor(
		message = "Unauthorized users not allowed!",
		statusCode = 403,
		cause = ""
	) {
		super(message);
		this.name = "UnauthorizedError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = UnauthorizedError;
