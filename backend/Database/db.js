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
const debug = !(process.env.ENV === "Production");

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

async function addUser(username, passwordHash, email) {
	if (!username || !passwordHash || !email) {
		throw new UserCredentialsValidationError(
			"Important parameters missing for adding user in the database!",
			undefined,
			(cause = "Missing credentials"),
			(InvalidCredentialsList = [
				...(!username ? [username] : []),
				...(!passwordHash ? [passwordHash] : []),
				...(!email ? [email] : []),
			])
		);
	}
	try {
		const userExists = await users.user.find({ username }).catch((err) => {
			throw new DatabaseQueryError();
		});
		if (debug) console.log("userExists:", userExists);
		if (userExists.length > 0) {
			return { status: "error", data: "User Not Added!", added: false };
		}
		const added = await users.user.insertOne({
			username,
			passwordHash,
			email,
		});
		if (debug) console.log("new user added:", added);
		return { status: "OK", data: "User Added!", added: true };
	} catch (error) {
		console.error("Error while adding user:\n", error);
		throw new DatabaseQueryError(
			error.message ?? "Error while adding user in database!",
			error.statusCode ?? undefined
		);
	}
}

async function getUser(username, passwordHash) {
	if (debug) console.log("username and password: ", username, passwordHash);

	if (!username || !passwordHash) {
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
		if (debug)
			console.log("result:", result, "\n\n", "type:", typeof result);
		if (
			(Array.isArray(result) && result.length > 0) ||
			(typeof result === "object" && Object.keys(result).length > 0)
		) {
			const user =
				result[Array.isArray(result) ? 0 : Object.keys(result)[0]];
			if (!user.username)
				throw new InvalidDatabaseEntryError(
					"Username missing in the user entry!"
				);
			return {
				status: "OK",
				data: "User Exists!",
				username: user.username,
			};
		} else {
			throw new InvalidCredentialsError(
				"Invalid Username or Password!",
				400
			);
		}
	} catch (error) {
		console.error("Error while getting user:\n", error);
		throw new DatabaseQueryError(
			error.message ?? "Error while fetching user in database!",
			error.statusCode
		);
	}
}

async function getUserViaEmail(email) {
	if (debug) console.log("email: ", email);

	if (!email) {
		throw new UserCredentialsValidationError(
			"Important parameters missing for adding user in the database!",
			undefined,
			(cause = "Missing credentials"),
			(InvalidCredentialsList = [...(!email ? [email] : [])])
		);
	}
	try {
		const result = await users.user
			.find({
				email,
			})
			.catch((err) => {
				console.error("Error while checking for user in db:\n", err);
				throw new DatabaseQueryError(
					"Error while fetching user in database!"
				);
			});
		if (debug)
			console.log("result:", result, "\n\n", "type:", typeof result);
		if (
			(Array.isArray(result) && result.length > 0) ||
			(typeof result === "object" && Object.keys(result).length > 0)
		) {
			const user =
				result[Array.isArray(result) ? 0 : Object.keys(result)[0]];
			if (!user.username)
				throw new InvalidDatabaseEntryError(
					"Username missing in the user entry!"
				);
			return {
				status: "OK",
				data: "User Exists!",
				username: user.username,
			};
		} else {
			throw new InvalidCredentialsError("Invalid Email!", 400);
		}
	} catch (error) {
		console.error("Error while getting user:\n", error);
		throw new DatabaseQueryError(
			error.message ?? "Error while fetching user in database!",
			error.statusCode
		);
	}
}

module.exports = {
	connectToMongoDB,
	addUser,
	getUser,
	getUserViaEmail,
};
