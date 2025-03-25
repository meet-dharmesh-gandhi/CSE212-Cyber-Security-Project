const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const anyAuth = require("any-auth");
const cors = require("cors");
const db = require("./Database/db.js");
const {
	ServerError,
	DatabaseQueryError,
	UserCredentialsValidationError,
	InvalidCredentialsError,
} = require("./Errors/Errors.js");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const {
	sendEmail,
	getIpAddress,
	decodeIncomingData,
	SHA256Hash,
	createJWT,
	createCookieSettings,
	RSADecryptMiddleware,
	parseJWT,
	formatJSONObject,
} = require("./Functions/utility-functions.js");

const app = express();
dotenv.config();
db.connectToMongoDB();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "someoneidontknow121@gmail.com",
		pass: "hyit kgjl iavt qehi",
	},
});
const frontendUrl =
	process.env.ENV === "Production"
		? process.env.PRODUCTION_CLIENT_URL
		: process.env.DEV_CLIENT_URL;
const backendUrl =
	process.env.ENV === "Production"
		? process.env.PRODUCTION_SERVER_URL
		: process.env.DEV_SERVER_URL;
const JWT_SECRET_KEY = process.env.JWT_SECRET;
if (!JWT_SECRET_KEY) throw new ServerError("Could not find JWT_SECRET_KEY");

app.use(express.json());
app.use(
	cors({
		origin: [
			frontendUrl + (frontendUrl.endsWith("/") ? "" : "/"),
			frontendUrl.endsWith("/")
				? frontendUrl.slice(0, frontendUrl.length - 1)
				: frontendUrl,
		],
		credentials: true,
	})
);
app.use(cookieParser());
app.use(RSADecryptMiddleware);

const port = 9000;
const requireInfo = ["username", "password", "email", "name"];
const debug = !(process.env.ENV === "Production");

//=============================
//=============================
//=============================

const configObject = {
	serverUrl: frontendUrl + "/",
	providers: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			redirectUri: backendUrl,
			scope: "email profile openid",
			serverEndPoint: "auth",
		},
	},
};

//=============================
//=============================
//=============================

anyAuth.setConfig(configObject, crypto);

app.all("/", (req, res) => res.send("Welcome to the server!"));

app.get("/view-cookies", async (req, res) => {
	if (debug) console.log(req.cookies);
	res.sendStatus(200);
});

app.post("/set-cookies", async (req, res) => {
	res.cookie("test-cookie", req.body.value ?? "test-value");
	res.sendStatus(200);
});

app.post("/get-user", async (req, res) => {
	try {
		let { data } = req.body;
		if (debug) console.log(data);
		let [username, password] = [];
		try {
			[username, password] = JSON.parse(data);
		} catch (error) {
			console.error("Invalid JSON Object:", error);
			throw new ServerError("Could not retrieve the credentials sent!");
		}
		password = SHA256Hash(password);
		try {
			const result = await db.getUser(username, password);
			if (result.status === "OK" && result.data === "User Exists!") {
				if (debug) console.log("result:");
				if (debug) console.table(result);
				const token = createJWT(
					[result.username, result.email],
					frontendUrl
				);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(process.env.ENV === "Production")
				);
				return res.status(200).send({
					status: "success",
					data: result.username,
					exists: true,
				});
			} else if (result.status === "OK") {
				// ! the login failed! send mail alert!
				try {
					const userExists = await db.getUserParameters(username);
					const email = userExists.email;
					console.log(
						"email and username obtained:",
						username,
						email
					);
					const [ipStatusCode, ipData] = await getIpAddress(req);
					if (
						ipStatusCode === 500 &&
						process.env.ENV === "Production"
					)
						throw new ServerError("Invalid IP Address Found");
					console.log("Sending mail, got ip...");
					console.table(ipData);
					const text = `We have sent this mail to alert you about a failed login which took place in your account.\nThe request is initiated from the IP Address with the following details: \n ${
						typeof ipData.data === "object"
							? formatJSONObject(ipData.data)
							: ipData.data
					}`;
					const [mailStatusCode, mailData] = await sendEmail(
						transporter,
						email,
						"someoneidontknow121@gmail.com",
						text
					);
					console.log("mail data");
					console.table(mailData);
				} catch (error) {
				} finally {
					return res.status(500).send({
						status: "error",
						data: "User does not exist",
						exists: false,
					});
				}
			}
		} catch (error) {
			throw new DatabaseQueryError(
				error.message ??
					"Unknown error while fetching user in Database!",
				error.statusCode
			);
		}
	} catch (error) {
		console.error("/get-user:", error);
		res.status(error.statusCode ?? 500).json({
			status: "error",
			data: error.message,
			exists: false,
		});
	}
});

app.post("/add-user", async (req, res) => {
	try {
		let { data } = req.body;
		if (debug) console.log(data);
		let username, password, email;
		try {
			[username, password, email] = JSON.parse(data);
			if (!username || !password || !email) {
				console.error("sign up params missing!", [
					...(!username ? ["username"] : []),
					...(!password ? ["password"] : []),
					...(!email ? ["email"] : []),
				]);
				throw new UserCredentialsValidationError(
					"Important sign up parameters are missing!",
					400,
					undefined,
					[
						...(!username ? ["username"] : []),
						...(!password ? ["password"] : []),
						...(!email ? ["email"] : []),
					]
				);
			}
		} catch (error) {
			console.error("Invalid JSON Object:", error);
			throw new ServerError("Could not retrieve the credentials sent!");
		}
		password = SHA256Hash(password);
		try {
			const added = await db.addUser(username, password, email);
			if (added.status === "OK" && added.data === "User Added!") {
				const token = createJWT([username, email], frontendUrl);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(process.env.ENV === "Production")
				);
				return res.status(200).send({
					status: "success",
					data: "User added",
					exists: false,
					added: true,
				});
			} else {
				return res.status(409).send({
					status: "error",
					data: "User Already Exists",
					exists: true,
					added: false,
				});
			}
		} catch (error) {
			throw new DatabaseQueryError(
				error.message ??
					"Unknown error while fetching user in Database: " + error,
				error.statusCode ?? 500
			);
		}
	} catch (error) {
		console.error("/get-user:", error);
		return res.status(error.statusCode).json({
			status: "error",
			data: error.message,
			exists: false,
			added: false,
		});
	}
});

app.post("/get-user-via-email", async (req, res) => {
	try {
		let { data } = req.body;
		if (debug) console.log(data);
		let [email] = [];
		try {
			[email] = JSON.parse(data);
		} catch (error) {
			console.error("Invalid JSON Object:", error);
			throw new ServerError("Could not retrieve the credentials sent!");
		}
		try {
			const result = await db.getUserViaEmail(email);
			if (result.status === "OK" && result.data === "User Exists!") {
				const token = createJWT([result.username, email], frontendUrl);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(process.env.ENV === "Production")
				);
				return res.status(200).send({
					status: "success",
					data: result.username,
					exists: true,
				});
			} else if (result.status === "OK") {
				return res.status(500).send({
					status: "error",
					data: "User does not exist",
					exists: false,
				});
			}
		} catch (error) {
			throw new DatabaseQueryError(
				error.message ??
					"Unknown error while fetching user in Database!",
				error.statusCode
			);
		}
	} catch (error) {
		console.error("/get-user-via-email:", error);
		res.status(error.statusCode ?? 500).json({
			status: "error",
			data: error.message,
			exists: false,
		});
	}
});

app.post("/add-user-via-email", async (req, res) => {
	try {
		let { data } = req.body;
		if (debug) console.log(data);
		let email;
		try {
			[email] = JSON.parse(data);
			if (!email) {
				console.error("sign up params missing!", [
					...(!email ? ["email"] : []),
				]);
				throw new UserCredentialsValidationError(
					"Important sign up parameters are missing!",
					400,
					undefined,
					[...(!email ? ["email"] : [])]
				);
			}
		} catch (error) {
			console.error("Invalid JSON Object:", error);
			throw new ServerError("Could not retrieve the credentials sent!");
		}
		try {
			const result = await db.addUserViaEmail(email);
			if (
				result.status === "OK" &&
				result.data === "User Does Not Exist!"
			) {
				const token = createJWT([result.username, email], frontendUrl);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(process.env.ENV === "Production")
				);
				return res.status(200).send({
					status: "success",
					data: "User Does Not Exist",
					exists: false,
				});
			} else if (result.status === "OK") {
				return res.status(409).send({
					status: "error",
					data: "User exists",
					exists: true,
				});
			}
		} catch (error) {
			throw new DatabaseQueryError(
				error.message ??
					"Unknown error while fetching user in Database: " + error,
				error.statusCode ?? 500
			);
		}
	} catch (error) {
		console.error("/add-user-via-email:", error);
		return res.status(error.statusCode).json({
			status: "error",
			data: error.message,
			exists: false,
		});
	}
});

app.get("/check-valid-user", async (req, res) => {
	try {
		const cookies = req.cookies;
		if (!cookies.authToken)
			return res
				.status(400)
				.send({ status: "error", data: "Token not found!" });
		console.log("Token Exists!");
		const token = cookies.authToken;
		console.log("token:", token);
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let username, email;
		try {
			[username, email] = JSON.parse(parsedToken);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("username:", username, "email:", email);
		const userFound = await db.checkUserInDB(username, email);
		if (userFound.exists) return res.sendStatus(200);
		return res.sendStatus(400);
	} catch (error) {
		res.sendStatus(500);
	}
});

app.post("/get-user-details", async (req, res) => {
	try {
		const { data } = req.body;
		let username;
		try {
			const [username] = JSON.parse(data);
			if (!username)
				throw new InvalidCredentialsError("Invalid username provided!");
		} catch (error) {
			throw new ServerError(
				"Could not retrieve credentials sent!",
				undefined,
				"JSON parsing failed!"
			);
		}
		const userDetails = await db.getUserDetails(username, req.cookies);
		res.status(200).send(userDetails);
	} catch (error) {
		return res
			.status(error.statusCode ?? 500)
			.send(error.message ?? "Unknown Error occurred in the server!");
	}
});

app.get("/get-cookie-data", async (req, res) => {
	try {
		console.log("In get-cookie-data");
		const token = req.cookies.authToken;
		if (!token) return res.sendStatus(400);
		let username, email;
		try {
			[username, email] = JSON.parse(parseJWT(token));
			if (!username || !email)
				throw new UserCredentialsValidationError(
					"Important sign up parameters are missing!",
					400,
					undefined,
					[...(!email ? ["email"] : [])]
				);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("username & email:", username, email);
		res.status(200).send({
			username,
			email,
		});
	} catch (error) {
		res.sendStatus(500);
	}
});

app.get("/send-reset-password-alert", async (req, res) => {
	try {
		console.log("sending alert...");
		if (!req.cookies.authToken)
			throw new InvalidCredentialsError("Invalid authToken given");
		console.log("credentials valid!");
		const token = req.cookies.authToken;
		const tokenSet = await db.setToken(token);
		console.log("token set...");
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let username, email;
		try {
			[username, email] = JSON.parse(parsedToken);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("email and username obtained:", username, email);
		const [ipStatusCode, ipData] = await getIpAddress(req);
		if (ipStatusCode === 500 && process.env.ENV === "Production")
			throw new ServerError("Invalid IP Address Found");
		console.log("Sending mail, got ip...");
		console.table(ipData);
		const text = `We have sent this mail to confirm your reset-password request.\nThe request is initiated from the IP Address with the following details: \n ${
			typeof ipData.data === "object"
				? formatJSONObject(ipData.data)
				: ipData.data
		}\nIf you have not initiated the request, you don't need to take any action and can close this mail. But if the request was initiated by you, click on the link below to verify the request and continue to reset your password\nLink: ${
			frontendUrl + (frontendUrl.endsWith("/") ? "" : "/")
		}verify-token?token=${token}`;
		const [mailStatusCode, mailData] = await sendEmail(
			transporter,
			email,
			"someoneidontknow121@gmail.com",
			text
		);
		console.log("mail data");
		console.table(mailData);
		res.sendStatus(200);
	} catch (error) {
		console.error("error in send-reset-password-alert:", error);
		res.sendStatus(error.statusCode ?? 500);
	}
});

app.post("/send-reset-email-alert", async (req, res) => {
	try {
		console.log("sending alert...");
		if (!req.cookies.authToken)
			throw new InvalidCredentialsError("Invalid authToken given");
		console.log("credentials valid!");
		const token = req.cookies.authToken;
		const tokenSet = await db.setToken(token);
		console.log("token set...");
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		const { data } = req.body;
		let username, email;
		try {
			[username] = JSON.parse(parsedToken);
			[email] = JSON.parse(data);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("email and username obtained:", username, email);
		const [ipStatusCode, ipData] = await getIpAddress(req);
		if (ipStatusCode === 500 && process.env.ENV === "Production")
			throw new ServerError("Invalid IP Address Found");
		console.log("Sending mail, got ip...");
		console.table(ipData);
		const text = `We have sent this mail to confirm your reset request.\nThe request is initiated from the IP Address with the following details: \n ${
			typeof ipData.data === "object"
				? formatJSONObject(ipData.data)
				: ipData.data
		}\nIf you have not initiated the request, you don't need to take any action and can close this mail. But if the request was initiated by you, click on the link below to verify the request and continue to reset your email\nLink: ${
			frontendUrl + (frontendUrl.endsWith("/") ? "" : "/")
		}verify-token?token=${token}`;
		const [mailStatusCode, mailData] = await sendEmail(
			transporter,
			email,
			"someoneidontknow121@gmail.com",
			text
		);
		console.log("mail data");
		console.table(mailData);
		res.sendStatus(200);
	} catch (error) {
		console.error("error in send-reset-email-alert:", error);
		res.sendStatus(error.statusCode ?? 500);
	}
});

app.get("/send-reset-username-alert", async (req, res) => {
	try {
		console.log("sending alert...");
		if (!req.cookies.authToken)
			throw new InvalidCredentialsError("Invalid authToken given");
		console.log("credentials valid!");
		const token = req.cookies.authToken;
		const tokenSet = await db.setToken(token);
		console.log("token set...");
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let email, username;
		try {
			console.log("parsedToken:", parsedToken);
			[username, email] = JSON.parse(parsedToken);
			console.log("username:", username, "email:", email);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("email and username obtained:", email, username);
		const [ipStatusCode, ipData] = await getIpAddress(req);
		if (ipStatusCode === 500 && process.env.ENV === "Production")
			throw new ServerError("Invalid IP Address Found");
		console.log("Sending mail, got ip...");
		console.table(ipData);
		const text = `We have sent this mail to confirm your reset request.\nThe request is initiated from the IP Address with the following details: \n ${
			typeof ipData.data === "object"
				? formatJSONObject(ipData.data)
				: ipData.data
		}\nIf you have not initiated the request, you don't need to take any action and can close this mail. But if the request was initiated by you, click on the link below to verify the request and continue to reset your email\nLink: ${
			frontendUrl + (frontendUrl.endsWith("/") ? "" : "/")
		}verify-token?token=${token}`;
		const [mailStatusCode, mailData] = await sendEmail(
			transporter,
			email,
			"someoneidontknow121@gmail.com",
			text
		);
		console.log("mail data");
		console.table(mailData);
		res.sendStatus(200);
	} catch (error) {
		console.error("error in send-reset-username-alert:", error);
		res.sendStatus(error.statusCode ?? 500);
	}
});

app.get("/send-delete-account-alert", async (req, res) => {
	try {
		console.log("sending alert...");
		if (!req.cookies.authToken)
			throw new InvalidCredentialsError("Invalid authToken given");
		console.log("credentials valid!");
		const token = req.cookies.authToken;
		const tokenSet = await db.setToken(token);
		console.log("token set...");
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let email, username;
		try {
			console.log("parsedToken:", parsedToken);
			[username, email] = JSON.parse(parsedToken);
			console.log("username:", username, "email:", email);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("email and username obtained:", email, username);
		const [ipStatusCode, ipData] = await getIpAddress(req);
		if (ipStatusCode === 500 && process.env.ENV === "Production")
			throw new ServerError("Invalid IP Address Found");
		console.log("Sending mail, got ip...");
		console.table(ipData);
		const text = `We have sent this mail to confirm your request to delete your account.\nThe request is initiated from the IP Address with the following details: \n ${
			typeof ipData.data === "object"
				? formatJSONObject(ipData.data)
				: ipData.data
		}\nIf you have not initiated the request, you don't need to take any action and can close this mail. But if the request was initiated by you, click on the link below to verify the request and continue to delete your account\nLink: ${
			frontendUrl + (frontendUrl.endsWith("/") ? "" : "/")
		}verify-token?token=${token}`;
		const [mailStatusCode, mailData] = await sendEmail(
			transporter,
			email,
			"someoneidontknow121@gmail.com",
			text
		);
		console.log("mail data");
		console.table(mailData);
		res.sendStatus(200);
	} catch (error) {
		console.error("error in send-delete-account-alert:", error);
		res.sendStatus(error.statusCode ?? 500);
	}
});

app.get("/verify-token/:token", async (req, res) => {
	try {
		if (debug) console.log("in verify-token");
		const { token } = req.params;
		if (debug) console.log(req.params);
		if (debug) console.log(token);
		if (!token) return res.sendStatus(500);
		const tokenUpdated = await db.approveToken(token);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(error.statusCode ?? 500);
	}
});

app.get("/check-token", async (req, res) => {
	// long polling is used here to check if the token is approved or not
	const token = req.cookies.authToken;
	const tokenApproved = await db.checkTokenApproved(token);
	if (tokenApproved) return res.sendStatus(200);
	return res.sendStatus(404);
});

app.get("/create-otp", async (req, res) => {
	try {
		console.log("In create-otp");
		if (!req.cookies.authToken)
			throw new InvalidCredentialsError("Invalid authToken given");
		console.log("credentials valid!");
		const token = req.cookies.authToken;
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let username, email;
		try {
			[username, email] = JSON.parse(parsedToken);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("email and username obtained:", username, email);
		await db.storeOTP(transporter, email);
		return res.sendStatus(200);
	} catch (error) {
		console.error("Error in create-otp:", error);
		res.status(error.statusCode ?? 500).send(
			error.message ?? "Unknown error occurred while generating OTP"
		);
	}
});

app.post("/verify-otp", async (req, res) => {
	try {
		const { data } = req.body;
		let otp;
		try {
			[otp] = JSON.parse(data);
		} catch (error) {
			throw new ServerError(
				"Could not retrieve the credentials sent!",
				undefined,
				"Unable to parse the given data"
			);
		}
		console.log("In verify-otp, otp:", otp);
		const otpValid = await db.verifyOTP(otp);
		if (otpValid)
			return res.status(200).send({
				valid: true,
			});
		return res.status(404).send({
			valid: false,
		});
	} catch (error) {
		console.error("Error in verify-otp", error);
		return res
			.status(error.statusCode ?? 500)
			.send(error.message ?? "Unknown error while verifying OTP!");
	}
});

app.post("/reset-password", async (req, res) => {
	try {
		const token = req.cookies.authToken;
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let username, oldPassword, newPassword;
		try {
			[username] = JSON.parse(parsedToken);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("Got the username:", username);
		const { data } = req.body;
		try {
			[oldPassword, newPassword] = JSON.parse(data);
			if (!username || !oldPassword || !newPassword)
				throw new InvalidCredentialsError(
					"Important parameters for reset password are missing!",
					undefined,
					undefined,
					[
						...(username ? [] : ["username"]),
						...(oldPassword ? [] : ["previous password"]),
						...(newPassword ? [] : ["new password"]),
					]
				);
		} catch (error) {
			throw new ServerError(
				"Could not retrieve credentials sent!",
				undefined,
				"JSON parsing failed!"
			);
		}
		console.log("oldPassword:", oldPassword);
		console.log("newPassword:", newPassword);
		const { username: currentUsername, passwordHash: currentPasswordHash } =
			await db.getUserParameters(username);
		if (currentUsername !== username)
			throw new InvalidCredentialsError("Username mismatch!");
		const oldPasswordHash = SHA256Hash(oldPassword);
		const newPasswordHash = SHA256Hash(newPassword);
		if (currentPasswordHash === oldPasswordHash) {
			const passwordReset = await db.resetCredential(
				username,
				newPasswordHash,
				"passwordHash"
			);
			if (passwordReset.reset) return res.sendStatus(200);
			throw new DatabaseQueryError(
				"Unknown database error while resetting password!"
			);
		} else {
			throw new InvalidCredentialsError(
				"Old password and current password do not match!"
			);
		}
	} catch (error) {
		console.error("Error in reset-password:", error);
		return res
			.status(error.statusCode ?? 500)
			.send(error.message ?? "Unknown Error Occurred!");
	}
});

app.post("/reset-email", async (req, res) => {
	try {
		console.log("In reset-email");
		const token = req.cookies.authToken;
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let username, newEmail;
		try {
			[username] = JSON.parse(parsedToken);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("Got the username:", username);
		const { data } = req.body;
		try {
			[newEmail] = JSON.parse(data);
			if (!username || !newEmail)
				throw new InvalidCredentialsError(
					"Important parameters for reset password are missing!",
					undefined,
					undefined,
					[
						...(username ? [] : ["username"]),
						...(newEmail ? [] : ["new email"]),
					]
				);
		} catch (error) {
			throw new ServerError(
				"Could not retrieve credentials sent!",
				undefined,
				"JSON parsing failed!"
			);
		}
		console.log("username and email:", username, newEmail);
		const resetEmail = await db.resetCredential(
			username,
			newEmail,
			"email"
		);
		if (resetEmail.reset && resetEmail.status === "OK") {
			const token = createJWT([username, newEmail], frontendUrl);
			res.cookie(
				"authToken",
				token,
				createCookieSettings(process.env.ENV === "Production")
			);
			return res.sendStatus(200);
		}
		console.log("resetEmail:");
		console.table(resetEmail);
		return res.sendStatus(500);
	} catch (error) {
		console.error("Error in reset-email:", error);
		return res
			.status(error.statusCode ?? 500)
			.send(error.message ?? "Unknown Error Occurred!");
	}
});

app.post("/reset-username", async (req, res) => {
	try {
		console.log("In reset-username");
		const token = req.cookies.authToken;
		const parsedToken = parseJWT(token);
		console.log("parsedToken:", parsedToken);
		let username, oldUsername, newUsername, email;
		try {
			[username, email] = JSON.parse(parsedToken);
		} catch (error) {
			throw new InvalidCredentialsError(
				"Could not parse the given the token!"
			);
		}
		console.log("Got the username:", username);
		const { data } = req.body;
		try {
			[oldUsername, newUsername] = JSON.parse(data);
			if (!username || !oldUsername || !newUsername || !email)
				throw new InvalidCredentialsError(
					"Important parameters for reset password are missing!",
					undefined,
					undefined,
					[
						...(username ? [] : ["username"]),
						...(newUsername ? [] : ["new username"]),
						...(oldUsername ? [] : ["old username"]),
						...(email ? [] : ["email"]),
					]
				);
		} catch (error) {
			throw new ServerError(
				"Could not retrieve credentials sent!",
				undefined,
				"JSON parsing failed!"
			);
		}
		console.log("usernames:", username, newUsername);
		const resetUsername = await db.resetCredential(
			username,
			newUsername,
			"username"
		);
		if (resetUsername.reset && resetUsername.status === "OK") {
			const token = createJWT([newUsername, email], frontendUrl);
			res.cookie(
				"authToken",
				token,
				createCookieSettings(process.env.ENV === "Production")
			);
			return res.sendStatus(200);
		}
		console.log("resetUsername:");
		console.table(resetUsername);
		return res.sendStatus(500);
	} catch (error) {
		console.error("Error in reset-username:", error);
		return res
			.status(error.statusCode ?? 500)
			.send(error.message ?? "Unknown Error Occurred!");
	}
});

app.get("/logout", async (req, res) => {
	try {
		const cookies = req.cookies;
		if (!cookies.authToken) return res.sendStatus(400);
		res.clearCookie("authToken");
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(500);
	}
});

app.get("/delete-user", async (req, res) => {
	try {
		console.log("In /delete-user");
		const token = req.cookies.authToken;
		if (!token)
			throw new InvalidCredentialsError("Invalid Token Received!");
		const data = parseJWT(token);
		let email, username;
		try {
			[username, email] = JSON.parse(data);
			if (!username || !email) {
				throw new InvalidCredentialsError(
					"Important parameters for user deletion are missing!",
					undefined,
					undefined,
					[
						...(!username ? ["username"] : []),
						...(!email ? ["email"] : []),
					]
				);
			}
		} catch (error) {
			throw new ServerError("Could not parse the given token!");
		}
		const deletedUser = await db.deletedUserFromDB(username, email);
		if (deletedUser.deleted) res.sendStatus(200);
		else res.sendStatus(409);
	} catch (error) {
		console.error("Error in /delete-user", error);
		res.sendStatus(500);
	}
});

app.get("/login", async (req, res) => {
	const [ipStatusCode, ipData] = await getIpAddress(req, "8.8.8.8");
	const [mailStatusCode, mailData] = await sendEmail(
		transporter,
		req.body.to || "meet.g1@ahduni.edu.in",
		"someoneidontknow121@gmail.com"
	);
	res.status(ipStatusCode === 500 || mailStatusCode === 500 ? 500 : 200).send(
		{ ipData, mailData }
	);
});

app.post("/auth", async (req, res) =>
	res.send(await anyAuth.getUser(req.body))
);

app.post("/helper", async (req, res) =>
	res.send(await anyAuth.helperFunction(req.body))
);

app.post("/proxy", async (req, res) =>
	res.send(await anyAuth.useProxy(req.body))
);

app.listen(port, () => console.log(`Server is running on port ${port}!!`));
