const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const anyAuth = require("any-auth");
const cors = require("cors");

const app = express();
dotenv.config();

const frontendUrl = process.env.ENV === "Production" ? process.env.PRODUCTION_CLIENT_URL : process.env.DEV_CLIENT_URL;
const backendUrl = process.env.ENV === "Production" ? process.env.PRODUCTION_SERVER_URL : process.env.DEV_SERVER_URL

app.use(express.json());
app.use(cors({
	origin: [frontendUrl],
}));

const port = 9000;



//=============================
//=============================
//=============================



const configObject = {
	serverUrl: frontendUrl,
	providers: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			redirectUri: backendUrl,
			scope: "email profile openid",
			serverEndPoint: "/auth",
		},
	}
}



//=============================
//=============================
//=============================



anyAuth.setConfig(configObject, crypto);

app.get("/", (req, res) => res.send("Welcome to the server!"));

app.post("/auth", async (req, res) => res.send(await anyAuth.getUser(req.body)));

app.post("/helper", async (req, res) => res.send(await anyAuth.helperFunction(req.body)));

app.post("/proxy", async (req, res) => res.send(await anyAuth.useProxy(req.body)));

app.listen(port, () => console.log(`Server is running on port ${port}!!`));
