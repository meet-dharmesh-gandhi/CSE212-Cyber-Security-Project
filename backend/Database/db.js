const mongoose = require("mongoose");
const users = require("../Models/users.js");
const {
	DatabaseQueryError,
	InvalidCredentialsError,
	UserCredentialsValidationError,
	UserExistsError,
	UserNotFoundError,
	InvalidDatabaseEntryError,
} = require("../Errors/Errors.js");
// import mongoose from "mongoose";

async function connectToMongoDB() {
	await mongoose
		.connect(process.env.MONGODB_URI)
		.then(() =>
			console.log(
				"Connected to MongoDB database:",
				mongoose.connection.name
			)
		)
		.catch((err) => {
			console.error("Error while connecting to MongoDB", err);
			throw new DatabaseQueryError(
				"Could not connect to Database" + (": " + err.message ?? ""),
				503,
				"Invalid Connection Details"
			);
		});
}

function addUser(username, passwordHash, email, name) {
	if (!username || !passwordHash || !email || !name) {
		throw new UserCredentialsValidationError(
			"Important parameters missing for adding user in the database!",
			undefined,
			(cause = "Missing credentials"),
			(InvalidCredentialsList = [
				...(!username ? [username] : []),
				...(!passwordHash ? [passwordHash] : []),
				...(!email ? [email] : []),
				...(!name ? [name] : []),
			])
		);
	}
	try {
		users.default.insertOne({
			username,
			passwordHash,
			email,
			name,
		});
	} catch (error) {
		console.error("Error while adding user:\n", error);
		throw new DatabaseQueryError("Error while adding user in database!");
	}
}

async function getUser(username, passwordHash) {
	if (!username || !passwordHash) {
		// throw new Error(
		// 	"Important parameters missing for checking user in the database"
		// );
		throw new UserCredentialsValidationError(
			"Important parameters missing for adding user in the database!",
			undefined,
			(cause = "Missing credentials"),
			(InvalidCredentialsList = [
				...(!username ? [username] : []),
				...(!passwordHash ? [passwordHash] : []),
			])
		);
	}
	try {
		const result = await users.user
			.find({
				username,
				passwordHash,
			})
			.catch((err) => {
				console.error("Error while checking for user in db:\n", err);
				throw new DatabaseQueryError(
					"Error while fetching user in database!"
				);
			});
		// console.log(result + "\n\n\n" + typeof result);
		if (
			Array.isArray(result) ||
			(typeof result != "object" && Object.keys(result).length == 0)
		) {
			throw new InvalidCredentialsError("Invalid Username or Password!");
		} else {
			const user = result[Object.keys(result)[0]];
			if (!user.name)
				throw new InvalidDatabaseEntryError(
					"Name missing in the user entry!"
				);
			return { status: "OK", data: "User Exists!", username: user.name };
		}
	} catch (error) {
		console.error("Error while adding user:\n", error);
		throw new DatabaseQueryError("Error while fetching user in database!");
	}
}

module.exports = {
	connectToMongoDB,
	addUser,
	getUser,
};
