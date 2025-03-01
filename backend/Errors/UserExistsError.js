class UserExistsError extends Error {
	/**
	 * Used when a user already exists in the Database
	 * @param {string} [message = "User exists!"]
	 * @param {number} [statusCode = 409]
	 * @param {string} [cause]
	 */
	constructor(
		message = "User Already exists!",
		statusCode = 409,
		cause = ""
	) {
		super(message);
		this.name = "UserExistsError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = UserExistsError;
