const {
	ServerError,
	ForbiddenResourceError,
	DatabaseQueryError,
} = require("../Errors/Errors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const otps = require("../Models/otps");

const apisToIgnore = [
	"/view-cookies",
	"/set-cookies",
	"/auth",
	"/helper",
	"/proxy",
];
const debug = !(process.env.ENV === "Production");

function RSADecryptMiddleware(req, res, next) {
	for (let api of apisToIgnore) if (req.path.startsWith(api)) return next();
	try {
		if (debug) console.log("received:", req.body.data);
		if (req.body.data) req.body.data = decodeIncomingData(req.body.data);
		next();
	} catch (error) {
		console.error("Decryption Error in middleware!", error);
		res.status(400).send({
			status: "error",
			data: "Decryption error: " + error,
		});
	}
}

function decodeIncomingData(encryptedData) {
	const data = decodeURIComponent(encryptedData);
	const encryptedChunks = data.split("|");
	const decryptedChunks = encryptedChunks.map((chunk, ind) =>
		decodeIncomingDataChunk(chunk, ind)
	);
	return decryptedChunks.join("");
}

function decodeIncomingDataChunk(data, chunkNumber) {
	if (!/^[A-Za-z0-9+/=]+$/.test(data)) {
		throw new ServerError(
			"Invalid Base64 format received at chunk number: " +
				chunkNumber +
				" containing: " +
				data
		);
	}
	const encryptedData = Buffer.from(data, "base64");
	const decryptedData = crypto.privateDecrypt(
		{
			key: process.env.PRIVATE_KEY,
			oaepHash: "sha256",
			padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
		},
		encryptedData
	);
	return decryptedData.toString("utf8");
}

function SHA256Hash(data) {
	return crypto.createHash("sha256").update(data).digest("hex");
}

function AESEncrypt(data) {
	if (debug)
		console.log("key:", Buffer.from(process.env.AES_SECRET_KEY).length);
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(
		"aes-256-cbc",
		Buffer.from(process.env.AES_SECRET_KEY),
		iv
	);
	let encrypted = cipher.update(data, "utf8", "hex");
	encrypted += cipher.final("hex");
	return iv.toString("hex") + ":" + encrypted;
}

function AESDecrypt(data) {
	const [iv, encrypted] = data.split(":");
	const decipher = crypto.createDecipheriv(
		"aes-256-cbc",
		Buffer.from(process.env.AES_SECRET_KEY),
		Buffer.from(iv, "hex")
	);
	let decrypted = decipher.update(encrypted, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

function createJWT(data, audience, expiresIn = "1h") {
	if (debug) console.log("creating JWT...");
	const encryptedData = AESEncrypt(
		typeof data === "object"
			? JSON.stringify(data)
			: Array.isArray(data)
			? data.toString()
			: data
	);
	if (debug) console.log("encrypted data:", encryptedData);
	return jwt.sign({ data: encryptedData }, process.env.JWT_SECRET, {
		algorithm: "HS256",
		expiresIn,
		issuer: "cyber-tools",
		audience,
	});
}

function parseJWT(token, audience) {
	try {
		let tokenData;
		const extractTokenData = jwt.verify(
			token,
			process.env.JWT_SECRET,
			{
				issuer: "cyber-tools",
				audience,
			},
			(err, decoded) => {
				if (err || !decoded.data)
					throw new ForbiddenResourceError(
						"Invalid JWT given!",
						undefined,
						"Unable to extract information from the token!"
					);
				tokenData = decoded.data;
			}
		);
		return AESDecrypt(tokenData);
	} catch (error) {
		console.error("Error while parsing JWT: ", error);
	}
}

function createCookieSettings(secure, expiresIn = 15 * 60 * 1000) {
	if (debug) console.log("cookie:", secure, expiresIn);
	return {
		httpOnly: secure,
		secure,
		// signed: true,
		sameSite: secure ? "None" : "lax",
		maxAge: expiresIn,
	};
}

async function getIpAddress(req, test) {
	let ipAddress =
		process.env.ENV === "Production"
			? req.headers["x-forwarded-for"] || req.socket.remoteAddress
			: "1.1.1.1";
	if (debug) console.log("ipAddress:", ipAddress);
	if (test) ipAddress = test;
	const data = await fetch(`http://ip-api.com/json/${ipAddress}`)
		.then((data) => data.json())
		.then((data) => {
			if (data.status === "fail") {
				return [
					500,
					{
						status: "error",
						data:
							"Failed to get ip address: " +
							ipAddress +
							", Error message: " +
							data.message,
					},
				];
			} else {
				return [
					200,
					{
						status: "success",
						data,
					},
				];
			}
		});
	return data;
}

function formatJSONObject(obj) {
	return JSON.stringify(obj)
		.replace("{", "")
		.replace("}", "")
		.replaceAll(",", "\n")
		.replaceAll('"', "")
		.replaceAll(":", ": ");
}

async function sendEmail(transporter, to, from, text) {
	try {
		const mailOptions = {
			from,
			to,
			subject: "Hello from Cyber Tools!",
			text,
			messageId: Date.now() + "-cyber-tools",
		};
		const info = await transporter.sendMail(mailOptions);
		return [
			200,
			{ status: "success", data: "Email sent: " + info.response },
		];
	} catch (error) {
		return [
			500,
			{
				status: "error",
				data: "Email was not sent: " + error.message,
			},
		];
	}
}

function generateOTP() {
	if (debug) console.log("generating otp...");
	let digits = "0123456789";
	let otp = "";
	let len = digits.length;
	for (let i = 0; i < 6; i++) {
		otp += digits[Math.floor(Math.random() * len)];
	}
	if (debug) console.log("otp generated:", otp);
	return otp;
}

module.exports = {
	RSADecryptMiddleware,
	decodeIncomingData,
	SHA256Hash,
	AESEncrypt,
	AESDecrypt,
	createJWT,
	createCookieSettings,
	getIpAddress,
	sendEmail,
	parseJWT,
	generateOTP,
	formatJSONObject,
};
