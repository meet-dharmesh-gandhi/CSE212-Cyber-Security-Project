class UserCredentialsValidationError extends Error {
	/**
	 * Used if all the necessary parameters are not provided by the frontend
	 * @param {string} [message = "Parameters of credentials are missing!"]
	 * @param {number} [statusCode = 400]
	 * @param {string} [cause]
	 */
	constructor(
		message = "Parameters of credentials are missing!",
		statusCode = 400,
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
		this.name = "UserCredentialsValidationError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = UserCredentialsValidationError;
