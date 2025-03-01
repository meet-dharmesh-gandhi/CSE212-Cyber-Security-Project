class InvalidDatabaseEntryError extends Error {
	/**
	 * Used when and invalid entry is found in the database
	 * @param {string} [message = "Invalid entry found in Database!"]
	 * @param {number} [statusCode = 500]
	 * @param {string} [cause]
	 */
	constructor(
		message = "Invalid entry found in Database!",
		statusCode = 500,
		cause = ""
	) {
		super(message);
		this.name = "InvalidDatabaseEntryError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = InvalidDatabaseEntryError;
