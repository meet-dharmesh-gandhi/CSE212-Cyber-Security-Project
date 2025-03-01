class InvalidCredentialsError extends Error {
	/**
	 * Used when the user exists in the db but the credentials are provided wrong
	 * @param {string} [message = "Invalid credentials provided!"]
	 * @param {number} [statusCode = 401]
	 * @param {string} [cause]
	 * @param {Array<string>} [InvalidCredentialsList = []]
	 */
	constructor(
		message = "Invalid credentials provided!",
		statusCode = 401,
		cause = "",
		InvalidCredentialsList = []
	) {
		if (InvalidCredentialsList.length != 0) {
			message += " (Missing: " + InvalidCredentialsList[0];
			for (let i = 0; i < InvalidCredentialsList.length; i++) {
				const val = InvalidCredentialsList[i];
				if (i != 0 && i != InvalidCredentialsList.length - 1)
					message += ", " + val;
				else if (i == InvalidCredentialsList.length - 1)
					message += " and " + val;
			}
			message += ")";
		}
		super(message);
		this.name = "InvalidCredentialsError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = InvalidCredentialsError;
