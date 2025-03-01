module.exports = {
	// Used when user is not found
	UserNotFoundError: require("./UserNotFoundError"),

	// Used when the user exists in the db but the credentials are provided wrong
	InvalidCredentialsError: require("./InvalidCredentialsError"),

	// Used when a user already exists in the Database
	UserExistsError: require("./UserExistsError"),

	// Used if all the necessary parameters are not provided by the frontend
	UserCredentialsValidationError: require("./UserCredentialsValidationError"),

	// Used when an error occurs while querying the database
	DatabaseQueryError: require("./DatabaseQueryError"),

	// Used when access is required but the user is not authorized (all the pages except the sign up and sign in)
	UnauthorizedError: require("./UnauthorizedError"),

	// Used when an unknown route is accessed
	InvalidRouteError: require("./InvalidRouteError"),

	// Used when the user is unauthorized and tried to access some private resource
	ForbiddenResourceError: require("./ForbiddenResourceError"),

	// Used when the request does not have required parameters
	BadRequestError: require("./BadRequestError"),

	// Used if some generic error pops up during execution of server
	ServerError: require("./ServerError"),

	// Used when and invalid entry is found in the database
	InvalidDatabaseEntryError: require("./InvalidDatabaseEntryError"),

	// More Errors if needed
	//  : require("./"),
};
