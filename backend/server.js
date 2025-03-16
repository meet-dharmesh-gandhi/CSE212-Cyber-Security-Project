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
				const token = createJWT(result.username, frontendUrl);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(
						process.env.ENV === "Production",
						new URL(frontendUrl).hostname
					)
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
				const token = createJWT(username, frontendUrl);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(
						process.env.ENV === "Production",
						new URL(frontendUrl).hostname
					)
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
				const token = createJWT(result.username, frontendUrl);
				res.cookie(
					"authToken",
					token,
					createCookieSettings(
						process.env.ENV === "Production",
						new URL(frontendUrl).hostname
					)
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
	// try {
	// 	let { data } = req.body;
	// 	if (debug) console.log(data);
	// 	let username, password, email;
	// 	try {
	// 		[username, password, email] = JSON.parse(data);
	// 		if (!username || !password || !email) {
	// 			console.error("sign up params missing!", [
	// 				...(!username ? ["username"] : []),
	// 				...(!password ? ["password"] : []),
	// 				...(!email ? ["email"] : []),
	// 			]);
	// 			throw new UserCredentialsValidationError(
	// 				"Important sign up parameters are missing!",
	// 				400,
	// 				undefined,
	// 				[
	// 					...(!username ? ["username"] : []),
	// 					...(!password ? ["password"] : []),
	// 					...(!email ? ["email"] : []),
	// 				]
	// 			);
	// 		}
	// 	} catch (error) {
	// 		console.error("Invalid JSON Object:", error);
	// 		throw new ServerError("Could not retrieve the credentials sent!");
	// 	}
	// 	password = SHA256Hash(password);
	// 	try {
	// 		const added = await db.addUser(username, password, email);
	// 		if (added.status === "OK" && added.data === "User Added!") {
	// 			const token = createJWT(username, frontendUrl);
	// 			res.cookie(
	// 				"authToken",
	// 				token,
	// 				createCookieSettings(
	// 					process.env.ENV === "Production",
	// 					new URL(frontendUrl).hostname
	// 				)
	// 			);
	// 			return res.status(200).send({
	// 				status: "success",
	// 				data: "User added",
	// 				exists: false,
	// 				added: true,
	// 			});
	// 		} else {
	// 			return res.status(409).send({
	// 				status: "error",
	// 				data: "User Already Exists",
	// 				exists: true,
	// 				added: false,
	// 			});
	// 		}
	// 	} catch (error) {
	// 		throw new DatabaseQueryError(
	// 			error.message ??
	// 				"Unknown error while fetching user in Database: " + error,
	// 			error.statusCode ?? 500
	// 		);
	// 	}
	// } catch (error) {
	// 	console.error("/get-user:", error);
	// 	return res.status(error.statusCode).json({
	// 		status: "error",
	// 		data: error.message,
	// 		exists: false,
	// 		added: false,
	// 	});
	// }
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
