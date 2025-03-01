class ForbiddenResourceError extends Error {
	/**
	 * Used when the user is unauthorized and tried to access some private resource
	 * @param {string} [message = "User Forbidden!"]
	 * @param {number} [statusCode = 403]
	 * @param {string} [cause]
	 */
	constructor(message = "User Forbidden!", statusCode = 403, cause = "") {
		super(message);
		this.name = "ForbiddenResourceError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = ForbiddenResourceError;
