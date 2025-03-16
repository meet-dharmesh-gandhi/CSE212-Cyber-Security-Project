const { ServerError } = require("../Errors/Errors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const apisToIgnore = ["/view-cookies", "/set-cookies"];
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
	const encryptedData = AESEncrypt(data);
	if (debug) console.log("encrypted data:", encryptedData);
	return jwt.sign({ data: encryptedData }, process.env.JWT_SECRET, {
		algorithm: "HS256",
		expiresIn,
		issuer: "cyber-tools",
		audience,
	});
}

function createCookieSettings(secure, currentSite, expiresIn = 15 * 60 * 1000) {
	if (debug) console.log("cookie:", secure, currentSite, expiresIn);
	return {
		httpOnly: secure,
		secure,
		// signed: true,
		sameSite: secure ? "None" : "lax",
		maxAge: expiresIn,
	};
}

async function getIpAddress(req, test) {
	let ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	if (test) ipAddress = test;
	const data = await fetch(`http://ip-api.com/json/${ipAddress}`)
		.then((data) => data.json())
		.then((data) => {
			if (data.status === "fail") {
				return [
					500,
					{
						status: "error",
						data: "Failed to get ip address: " + data.message,
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

async function sendEmail(transporter, to, from) {
	try {
		const mailOptions = {
			from,
			to,
			subject: "Hello from nodemailer",
			text: `This is a sample mail from ${from}!! please ignore it!`,
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
};
