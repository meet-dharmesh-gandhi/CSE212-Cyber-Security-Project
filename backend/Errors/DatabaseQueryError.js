class DatabaseQueryError extends Error {
	/**
	 * Used when an error occurs while querying the database
	 * @param {string} [message = "Database Error!"]
	 * @param {number} [statusCode = 409]
	 * @param {string} [cause]
	 */
	constructor(message = "Database Error!", statusCode = 500, cause = "") {
		super(message);
		this.name = "DatabaseQueryError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = DatabaseQueryError;
