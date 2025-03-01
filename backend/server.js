const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const anyAuth = require("any-auth");
const cors = require("cors");
const db = require("./Database/db.js");
const fs = require("fs");
const { ServerError, DatabaseQueryError } = require("./Errors/Errors.js");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
dotenv.config();
db.connectToMongoDB();

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
		origin: [frontendUrl],
	})
);
app.use(cookieParser());

const port = 9000;

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

app.get("/", (req, res) => res.send("Welcome to the server!"));

app.post("/get-user", async (req, res) => {
	try {
		let { data } = req.body;
		data = decodeURIComponent(data);
		if (!/^[A-Za-z0-9+/=]+$/.test(data)) {
			throw new ServerError("Invalid Base64 format received!");
		}
		// console.log("data:", data, typeof data);
		const encryptedData = Buffer.from(data, "base64");
		// console.log("encryptedData:", encryptedData);
		// console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);
		const decryptedData = crypto.privateDecrypt(
			{
				key: process.env.PRIVATE_KEY,
				oaepHash: "sha256",
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			},
			encryptedData
		);
		// console.log("decryptedData:", decryptedData);
		const creds = decryptedData.toString("utf8");
		let [username, password] = [];
		try {
			[username, password] = JSON.parse(creds);
		} catch (error) {
			console.error("Invalid JSON Object:", error);
			throw new ServerError("Could not retrieve the credentials sent!");
		}
		// console.log(password);
		password = crypto.createHash("sha512").update(password).digest("hex");
		// console.log(username, password);
		try {
			const result = await db.getUser(username, password);
			if (result.status === "OK" && result.data === "User Exists!") {
				// cookie(name: string, val: string, options: CookieOptions): Response<any, Record<string, any>, number>

				// Set cookie name to val, with the given options.

				// Options:

				// maxAge max-age in milliseconds, converted to expires
				// signed sign the cookie
				// path defaults to "/"
				const token = jwt.sign(
					{ username: result.username },
					JWT_SECRET_KEY,
					{
						expiresIn: "1h",
					}
				);
				res.cookie("authToken", token, {
					httpOnly: true,
					secure: process.env.ENV === "Production" ? true : false,
					sameSite: "strict",
					maxAge: 3 * 60 * 60 * 1000,
				});
				return res.json({ data: result.username });
			} else {
				throw new ServerError("Unknown Error Occurred!");
			}
		} catch (error) {
			throw new DatabaseQueryError(
				"Unknown error while fetching user in Database!"
			);
		}
	} catch (error) {
		console.error("/get-user:", error);
		res.status(500).json({ status: "ERROR", data: error.message });
	}
});

app.post("/add-user", async (req, res) => {});

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
