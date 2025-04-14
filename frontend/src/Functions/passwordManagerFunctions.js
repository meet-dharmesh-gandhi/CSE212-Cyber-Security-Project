import {
	decryptDataAESGCM,
	encryptData,
	encryptDataAESGCM,
	generateIV,
	generateSalt,
} from "./cryptoFunctions";
import { backendUrl } from "../constants/Urls";
import { debug } from "../constants/Mode";

export function addPasswordToLocalStorage(password) {
	localStorage.setItem(
		"passwords",
		typeof password === "string" ? password : JSON.stringify(password)
	);
}

export function getPasswordFromLocalStorage() {
	return localStorage.getItem("passwords") ?? "{}";
}

export async function savePasswordsLocally(
	passwords,
	password,
	useLocalStorage = true,
	givenSalt,
	givenIV
) {
	let salt, iv;
	if (useLocalStorage) {
		const encryptedPasswords = getPasswordFromLocalStorage();
		if (debug) console.log("encryptedPasswords:");
		if (debug) console.log(encryptedPasswords);
		[salt, iv] = await getSaltAndIV(
			encryptedPasswords,
			Number.parseInt(process.env.REACT_APP_SALT_LENGTH),
			Number.parseInt(process.env.REACT_APP_IV_LENGTH)
		);
		if (debug) console.log("salt, iv:");
		if (debug) console.log(salt, iv);
	} else [salt, iv] = [givenSalt, givenIV];
	const newPassword = await encryptDataAESGCM(
		password,
		JSON.stringify(passwords),
		salt,
		iv
	);
	if (debug) console.log("newPasswords:");
	if (debug) console.log(newPassword);
	addPasswordToLocalStorage(newPassword);
}

export async function syncPasswordsToCloud(
	useLocalStorage = true,
	password,
	userPasswords,
	salt,
	iv
) {
	try {
		if (debug) console.log("salt, iv:");
		if (debug) console.log(salt, iv);
		const newPassword = useLocalStorage
			? getPasswordFromLocalStorage()
			: await encryptDataAESGCM(
					password,
					JSON.stringify(userPasswords),
					salt,
					iv
			  );
		const passwords = await encryptData([newPassword], debug).then((data) =>
			encodeURIComponent(data)
		);
		if (debug) console.log("passwords:");
		if (debug) console.log(passwords);
		const passwordsSynced = await fetch(backendUrl + "/sync-my-passwords", {
			method: "PUT",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ data: passwords }),
		});
		if (passwordsSynced.status === 200) return true;
		if (debug) console.log(passwordsSynced);
		return false;
	} catch (error) {
		console.error("Error while Syncing Passwords to Cloud:", error);
		return false;
	}
}

export async function getPasswordsFromCloud(password) {
	try {
		const cloudPasswords = await fetch(backendUrl + "/get-passwords", {
			method: "GET",
			credentials: "include",
		}).then((data) => data.json());
		if (debug) console.log("cloudPasswords:", cloudPasswords);
		if (!cloudPasswords.passwords)
			throw new Error("Invalid Response Received from the Server!");
		const decryptedCloudPasswords = await decryptDataAESGCM(
			password,
			cloudPasswords.passwords,
			Number.parseInt(process.env.REACT_APP_SALT_LENGTH),
			Number.parseInt(process.env.REACT_APP_IV_LENGTH)
		);
		const [salt, iv] = getSaltAndIV(
			cloudPasswords.passwords,
			Number.parseInt(process.env.REACT_APP_SALT_LENGTH),
			Number.parseInt(process.env.REACT_APP_IV_LENGTH)
		);
		try {
			const parsedCloudPasswords = JSON.parse(decryptedCloudPasswords);
			return [
				true,
				parsedCloudPasswords,
				[cloudPasswords.passwords, salt, iv],
			];
		} catch (error) {
			console.error(
				"Error while parsing the Decrypted Passwords from the Cloud!",
				error
			);
			throw new Error(
				"Error while parsing the Decrypted Passwords from the Cloud!"
			);
		}
	} catch (error) {
		return [false, null, null];
	}
}

export function getSaltAndIV(encryptedData, saltLength, ivLength) {
	const combined = Uint8Array.from(atob(encryptedData), (c) =>
		c.charCodeAt(0)
	);

	const salt = combined.slice(0, saltLength);
	const iv = combined.slice(saltLength, saltLength + ivLength);

	if (debug) console.log("salt and iv in getSaltAndIV:");
	if (debug) console.log(salt);
	if (debug) console.log(iv);

	return [salt, iv];
}

export async function initializePasswordManager(password) {
	// send a get request to ensure that the database marks it as initialized!
	// set an iv and salt
	// add a {} to the local storage, encrypt it
	const markPasswordManagerInitialized = await fetch(
		backendUrl + "/initialize-password-manager",
		{
			method: "POST",
			credentials: "include",
		}
	);
	if (markPasswordManagerInitialized.status !== 200) return false;
	const salt = generateSalt(process.env.REACT_APP_SALT_LENGTH);
	const iv = generateIV(process.env.REACT_APP_IV_LENGTH);
	const plainText = {};
	const encryptedPassword = await encryptDataAESGCM(
		password,
		JSON.stringify(plainText),
		salt,
		iv
	);
	if (debug) console.log(encryptedPassword);
	addPasswordToLocalStorage(encryptedPassword);
	return true;
}

export async function checkPasswordAndParsePasswords(
	password,
	encryptedPasswords
) {
	if (debug) console.log("encryptedPasswords: ", encryptedPasswords);
	if (debug) console.log("password: ", password);
	try {
		if (debug)
			console.log(
				"iv length: ",
				Number.parseInt(process.env.REACT_APP_IV_LENGTH)
			);
		const decryptedPasswords = await decryptDataAESGCM(
			password,
			encryptedPasswords,
			Number.parseInt(process.env.REACT_APP_SALT_LENGTH),
			Number.parseInt(process.env.REACT_APP_IV_LENGTH)
		);
		if (debug) console.log("decryptedPasswords:");
		if (debug) console.log(decryptedPasswords);
		const passwords = JSON.parse(decryptedPasswords);
		return [true, passwords];
	} catch (error) {
		console.error("Invalid Password:", error);
		return [false, null];
	}
}
