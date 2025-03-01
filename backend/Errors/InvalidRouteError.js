class InvalidRouteError extends Error {
	/**
	 * Used when an unknown route is accessed
	 * @param {string} [message = "Route does not exist!"]
	 * @param {number} [statusCode = 404]
	 * @param {string} [cause]
	 */
	constructor(
		message = "Route does not exist!",
		statusCode = 404,
		cause = ""
	) {
		super(message);
		this.name = "InvalidRouteError";
		this.statusCode = statusCode;
		if (cause) this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = InvalidRouteError;
