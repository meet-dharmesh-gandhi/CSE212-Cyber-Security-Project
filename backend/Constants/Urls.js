const frontendUrl = (
	process.env.ENV === "Production"
		? process.env.PRODUCTION_CLIENT_URL
		: process.env.DEV_CLIENT_URL
).replace(/\/$/g, "");
const backendUrl = (
	process.env.ENV === "Production"
		? process.env.PRODUCTION_SERVER_URL
		: process.env.DEV_SERVER_URL
).replace(/\/$/g, "");

module.exports = {
	frontendUrl,
	backendUrl,
};
