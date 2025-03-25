import { encryptData } from "./cryptoFunctions";
const debug = !(process.env.REACT_APP_ENV === "Production");

export async function loginOrSignUp(credentials, backendUrl, mode = "login") {
	const encryptedData = await encryptData(credentials, debug);
	const encodedData = encodeURIComponent(encryptedData);
	if (debug)
		console.log("base64:", encryptedData, "encodedData:", encodedData);
	if (debug) console.log("in8!");
	const result = await fetch(
		backendUrl +
			(backendUrl.endsWith("/") ? "" : "/") +
			(mode === "login" ? "get-user" : "add-user"),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				data: encodedData,
			}),
		}
	)
		.then((data) => data.json())
		.catch((err) =>
			console.error("Error while checking user in server: ", err)
		);
	return result;
}

export async function loginOrSignUpUsingEmail(email, backendUrl, mode) {
	const encryptedData = await encryptData([email], debug);
	let returnedStatus;
	if (debug) console.log("base64:", encryptedData);
	if (debug) console.log("in8!");
	const result = await fetch(
		backendUrl +
			(backendUrl.endsWith("/") ? "" : "/") +
			(mode === "login" ? "get" : "add") +
			"-user-via-email",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				data: encodeURIComponent(encryptedData),
			}),
			credentials: "include",
		}
	)
		.then((data) => {
			returnedStatus = data.status;
			return data.json();
		})
		.catch((err) =>
			console.error("Error while checking user in server: ", err)
		);
	return [result, returnedStatus];
}
