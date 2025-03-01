class UserNotFoundError extends Error {
	/**
	 * Used when user is not found
	 * @param {string} [message = "User not found!"]
	 * @param {number} [statusCode = 404]
	 * @param {string} [cause]
	 */
	constructor(message = "User not found!", statusCode = 404, cause = "") {
		super(message);
		this.name = "UserNotFoundError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = UserNotFoundError;
