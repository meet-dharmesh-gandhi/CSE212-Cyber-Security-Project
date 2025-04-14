export const frontendUrl = (
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL
).replace(/\/$/g, "");
export const backendUrl = (
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL
).replace(/\/$/g, "");
