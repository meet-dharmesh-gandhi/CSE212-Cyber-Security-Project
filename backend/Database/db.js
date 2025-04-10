const mongoose = require("mongoose");
const users = require("../Models/users.js");
const tokens = require("../Models/tokens.js");
const {
	DatabaseQueryError,
	InvalidCredentialsError,
	UserCredentialsValidationError,
	UserExistsError,
	UserNotFoundError,
	InvalidDatabaseEntryError,
	ServerError,
	UnauthorizedError,
} = require("../Errors/Errors.js");
const {
	parseJWT,
	generateOTP,
	sendEmail,
} = require("../Functions/utility-functions.js");
const otps = require("../Models/otps.js");
const passwordManager = require("../Models/passwordManager.js");
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
				email: user.email,
			};
		} else {
			return {
				status: "OK",
				data: "User does not exist!",
			};
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
			"Missing credentials",
			[...(!email ? [email] : [])]
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
			throw new InvalidCredentialsError(
				"Invalid Email!",
				400,
				"Email is not registered"
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

async function addUserViaEmail(email) {
	if (debug) console.log("email: ", email);

	if (!email) {
		throw new UserCredentialsValidationError(
			"Important parameters missing for adding user in the database!",
			undefined,
			"Missing credentials",
			[...(!email ? [email] : [])]
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
			throw new InvalidCredentialsError(
				"Invalid Email!",
				400,
				"Email already registered!"
			);
		} else {
			const newUsername = email.split("@")[0];
			const added = await users.user.insertOne({
				username: newUsername,
				passwordHash: "",
				email,
			});
			return {
				status: "OK",
				data: "User Does Not Exist!",
				username: newUsername,
			};
		}
	} catch (error) {
		console.error("Error while getting user:\n", error);
		throw new DatabaseQueryError(
			error.message ?? "Error while fetching user in database!",
			error.statusCode
		);
	}
}

async function getUserDetails(username, cookies) {
	if (debug) console.log("username:", username);

	if (!username)
		throw new UserCredentialsValidationError(
			"Important parameters missing for getting user details in the database!",
			undefined,
			(cause = "Missing credentials"),
			(InvalidCredentialsList = [...(!username ? [username] : [])])
		);

	if (!cookies || !cookies.authToken) throw new ServerError();
	const cookieDetails = parseJWT(cookies.authToken);
	const [cookieUsername, email] = cookieDetails;
	if (username !== cookieUsername)
		throw new UnauthorizedError(
			"Invalid username provided!",
			undefined,
			"Given username does not match the username in the cookie"
		);
	return {
		username: cookieUsername,
		email,
	};
}

async function getUserParameters(username) {
	try {
		if (!username)
			throw new InvalidCredentialsError(
				"Cannot get user details without username",
				undefined,
				"Username is missing!",
				["username"]
			);
		const result = await users.user.find({ username });
		if (result.length === 0)
			throw new UserNotFoundError(
				"User with given credentials does not exist!"
			);
		return result[0];
	} catch (error) {
		throw new DatabaseQueryError(
			error.message ??
				"Unknown error while querying the database!" + error
		);
	}
}

async function resetCredential(username, credential, credentialName) {
	try {
		const updated = await users.user.updateOne(
			{ username },
			{ $set: { [credentialName]: credential } }
		);
		return {
			status: "OK",
			reset: updated.acknowledged,
		};
	} catch (error) {
		throw new ServerError(
			error.message ?? "Unknown error occurred while resetting password"
		);
	}
}

async function setToken(token) {
	try {
		const set = await tokens.token.insertOne({
			token: token,
			createdAt: new Date(),
			state: "waiting",
		});
		return;
	} catch (error) {
		try {
			const exists = await tokens.token.find({
				token: token,
				state: "approved",
			});
			if (exists.length > 0) return;
			else if (debug) console.log("does not exist!");
			// throw new DatabaseQueryError(
			// 	"Duplicate token found!",
			// 	undefined,
			// 	"Cannot issue the same request twice!"
			// );
		} catch (error) {
			throw new DatabaseQueryError(
				error.message ?? "Error while setting token in database!"
			);
		}
	}
}

async function approveToken(token) {
	try {
		const updated = await tokens.token.updateOne(
			{ token },
			{ $set: { state: "approved" } }
		);
		return {
			status: "OK",
		};
	} catch (error) {
		throw new DatabaseQueryError(
			error.message ?? "Error while updating the token status in database"
		);
	}
}

async function checkTokenApproved(token) {
	try {
		const tokenExists = await tokens.token.find({
			token,
			state: "approved",
		});
		if (tokenExists.length > 0) return true;
		return false;
	} catch (error) {
		throw new DatabaseQueryError(
			error.message ?? "Error while checking the database"
		);
	}
}

async function verifyOTP(otp) {
	try {
		const otpPresent = (await otps.otp.find({ OTP: otp })).length > 0;
		if (otpPresent) return true;
		return false;
	} catch (error) {
		throw new DatabaseQueryError("Unable to verify OTP!");
	}
}

async function storeOTP(transporter, email) {
	try {
		const otp = generateOTP();
		if (debug) console.log("otp:", otp);
		const added = await otps.otp.insertOne({
			OTP: otp,
			createdAt: new Date(),
		});
		if (debug) console.log("added otp:", added);
		const text = `Hello there! Here is your OTP to reset your password: ${otp}\nDO NOT SHARE YOUR OTP WITH ANYONE, SHARING OTP MIGHT HELP ATTACKERS STEAL YOUR DATA!`;
		const [mailStatusCode, mailData] = await sendEmail(
			transporter,
			email,
			"someoneidontknow121@gmail.com",
			text
		);
		if (debug) console.log("In store OTP:");
		if (debug) console.table(mailData);
		if (debug) console.log("mailStatusCode:", mailStatusCode);
	} catch (error) {
		console.error("Error in storeOTP:", error);
		throw new DatabaseQueryError("Error while generating OTP");
	}
}

async function checkUserInDB(username, email) {
	try {
		const userExists = await users.user.find({ username, email });
		if (userExists.length <= 0)
			return {
				status: "OK",
				exists: false,
			};
		return {
			status: "OK",
			exists: true,
		};
	} catch (error) {
		console.error("Error while checking user in db:", error);
		throw new DatabaseQueryError("Error while checking data in database!");
	}
}

async function deletedUserFromDB(username, email) {
	try {
		const userExists = await users.user.deleteMany({ username, email });
		if (userExists.acknowledged && userExists.deletedCount > 0)
			return {
				status: "OK",
				deleted: true,
			};
		return {
			status: "OK",
			deleted: false,
		};
	} catch (error) {
		console.error("Error while deleting user from db:", error);
		throw new DatabaseQueryError("Error while deleting user in database!");
	}
}

async function markPasswordManagerInitialized(username) {
	try {
		const userExists = await users.user.find({ username });
		if (userExists.length <= 0) return 400;
		const checkPasswordManagerInitialized =
			await passwordManager.passwordManager.find({
				username,
				initialized: true,
			});
		if (checkPasswordManagerInitialized.length > 0) return 400;
		const userExistsInPasswordManagerDB =
			await passwordManager.passwordManager.find({
				username,
			});
		let passwordManagerInitialized;
		if (userExistsInPasswordManagerDB.length > 0) {
			passwordManagerInitialized =
				await passwordManager.passwordManager.updateOne(
					{ username },
					{
						$set: {
							initialized: true,
							passwords: JSON.stringify({}),
						},
					}
				);
			if (passwordManagerInitialized.modifiedCount > 0) return 200;
			if (passwordManagerInitialized.acknowledged) return 400;
		} else {
			passwordManagerInitialized =
				await passwordManager.passwordManager.insertOne({
					username,
					passwords: JSON.stringify({}),
					initialized: true,
				});
			if (debug) console.log("Initialized a Password Manager!");
			return 200;
		}
		if (debug) console.log("markPasswordManagerInitialized error:");
		if (debug) console.log(JSON.stringify(passwordManagerInitialized));
		throw new ServerError(
			"Could not initialize the password manager due to an unknown error"
		);
	} catch (error) {
		console.error("Error while initializing the password manager!", error);
		throw new ServerError(
			"Unknown Error while initializing the password manager",
			error
		);
	}
}

async function addPasswordsToDatabase(username, passwords) {
	try {
		const userExists = await users.user.find({ username });
		if (userExists.length <= 0) return 400;
		const passwordManagerInitialized =
			await passwordManager.passwordManager.find({
				username,
				initialized: true,
			});
		if (passwordManagerInitialized.length == 0) return 400;
		const passwordsStored = await passwordManager.passwordManager.updateOne(
			{ username },
			{ $set: { passwords } }
		);
		if (!passwordsStored.acknowledged) return 400;
		return 200;
	} catch (error) {
		console.error("Error while initializing the password manager!", error);
		throw new ServerError(
			"Unknown Error while initializing the password manager",
			error
		);
	}
}

async function checkIfPasswordManagerInitialized(username) {
	try {
		const userExists = await users.user.find({ username });
		if (userExists.length <= 0) return 400;
		const checkPasswordManagerInitialized =
			await passwordManager.passwordManager.find({
				username,
				initialized: true,
			});
		if (checkPasswordManagerInitialized.length == 0) return 400;
		return 200;
	} catch (error) {
		console.error("Error while initializing the password manager!", error);
		throw new ServerError(
			"Unknown Error while initializing the password manager",
			error
		);
	}
}

async function getPasswordsFromDatabase(username) {
	try {
		const userExists = await users.user.find({ username });
		const userPasswordsExist = await passwordManager.passwordManager.find({
			username,
		});
		if (userExists.length <= 0 || userPasswordsExist.length <= 0)
			return [400, "Invalid Username!"];
		return [200, userPasswordsExist[0].passwords];
	} catch (error) {
		console.error("Error while initializing the password manager!", error);
		throw new ServerError(
			"Unknown Error while initializing the password manager",
			error
		);
	}
}

module.exports = {
	connectToMongoDB,
	addUser,
	getUser,
	getUserViaEmail,
	addUserViaEmail,
	getUserDetails,
	getUserParameters,
	resetCredential,
	setToken,
	verifyOTP,
	storeOTP,
	approveToken,
	checkTokenApproved,
	checkUserInDB,
	deletedUserFromDB,
	markPasswordManagerInitialized,
	addPasswordsToDatabase,
	checkIfPasswordManagerInitialized,
	getPasswordsFromDatabase,
};
