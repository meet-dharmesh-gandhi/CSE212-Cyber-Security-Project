import { debug } from "../constants/Mode";

export async function encryptData(data, debug = false) {
	const chunkSize = Number.parseInt(
		process.env.REACT_APP_PUBLIC_KEY_CHUNK_SIZE
	);
	if (debug) console.log("chunkSize:", chunkSize);
	if (debug) console.log("data:", data);
	const chunks = [];
	const base64Key = process.env.REACT_APP_PUBLIC_KEY.replace(
		/-----BEGIN PUBLIC KEY-----/g,
		""
	)
		.replace(/-----END PUBLIC KEY-----/g, "")
		.replace(/\n/g, "");
	if (debug) console.log(base64Key);
	const rawKey = atob(base64Key);
	const publicKeyBinary = Uint8Array.from(rawKey, (c) =>
		c.charCodeAt(0)
	).buffer;
	if (debug) console.log("in5!", publicKeyBinary.byteLength);
	const publicKey = await window.crypto.subtle.importKey(
		"spki",
		publicKeyBinary,
		{ name: "RSA-OAEP", hash: "SHA-256" },
		false,
		["encrypt"]
	);
	let encodedData = new TextEncoder().encode(JSON.stringify(data));
	if (debug) console.log("in6!", publicKey);
	if (debug) console.log(encodedData.length);
	if (debug) console.log(encodedData);
	if (debug) console.log(JSON.stringify(data));
	// const bufferData = Buffer.from(data, "utf-8");
	// const encoder = new TextEncoder();
	// const bufferData = encoder.encode(data);
	for (let i = 0; i < encodedData.length; i += chunkSize) {
		const chunk = encodedData.slice(i, i + chunkSize);
		if (debug) console.log("chunk:", chunk);
		const encryptedChunk = await encryptDataChunk(chunk, publicKey, debug);
		if (debug) console.log("encryptedChunk: ", encryptedChunk, "index:", i);
		if (!encryptedChunk) throw new Error("Null Chunk was Found!");
		chunks.push(encryptedChunk);
	}
	if (debug) console.log("chunks:", chunks);
	return chunks.join("|");
}

export async function encryptDataChunk(data, publicKey, debug = false) {
	try {
		if (debug) console.log("data:", data);
		const encryptedData = await window.crypto.subtle.encrypt(
			{ name: "RSA-OAEP" },
			publicKey,
			data
		);
		if (debug) console.log(encryptedData);
		if (debug) console.log("in7!");
		const base64EncryptedData = btoa(
			String.fromCharCode.apply(null, new Uint8Array(encryptedData))
		);
		return base64EncryptedData;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export async function doPBKDF2(password, salt) {
	const encoder = new TextEncoder();
	const importedKey = await window.crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveKey"]
	);
	return window.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: 100000, // High iteration count for security
			hash: "SHA-256",
		},
		importedKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

export async function encryptDataAESGCM(password, plaintext, salt, iv) {
	const key = await doPBKDF2(password, salt);

	if (debug) console.log("password, plaintext, salt, iv, key:");
	if (debug) console.log(password);
	if (debug) console.log(plaintext);
	if (debug) console.log(salt);
	if (debug) console.log(iv);
	if (debug) console.log(key);

	const encoder = new TextEncoder();
	const encrypted = await window.crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: iv },
		key,
		encoder.encode(plaintext)
	);

	if (debug) console.log("encrypted:");
	if (debug) console.log(encrypted);

	const combined = new Uint8Array(
		salt.length + iv.length + encrypted.byteLength
	);
	combined.set(salt, 0);
	combined.set(iv, salt.length);
	combined.set(new Uint8Array(encrypted), salt.length + iv.length);

	if (debug) console.log("combined:");
	if (debug) console.log(combined);

	return btoa(String.fromCharCode(...combined)); // Convert to Base64
}

export async function decryptDataAESGCM(
	password,
	encryptedData,
	saltLength,
	ivLength
) {
	try {
		const combined = Uint8Array.from(atob(encryptedData), (c) =>
			c.charCodeAt(0)
		);

		const salt = combined.slice(0, saltLength);
		const iv = combined.slice(saltLength, saltLength + ivLength);
		const ciphertext = combined.slice(saltLength + ivLength);

		if (debug) console.log(salt);
		if (debug) console.log(iv);
		if (debug) console.log(ciphertext);

		const key = await doPBKDF2(password, salt);

		if (debug) console.log("Got key:", key);

		const decrypted = await window.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv },
			key,
			ciphertext
		);

		if (debug) console.log("Decrypted:", decrypted);
		return new TextDecoder().decode(decrypted);
	} catch (error) {
		if (debug) console.error("Error while decrypting: ", error);
	}
}

export async function encryptFilesAESGCM(password, file) {
	console.log(password);
	console.log(file);
	const salt = generateSalt(process.env.REACT_APP_SALT_LENGTH);
	const iv = generateIV(process.env.REACT_APP_IV_LENGTH);
	const key = await doPBKDF2(password, salt);
	const fileBuffer = await file.arrayBuffer();

	if (debug) console.log("password, plaintext, salt, iv, key:");
	if (debug) console.log(password);
	if (debug) console.log(salt);
	if (debug) console.log(iv);
	if (debug) console.log(key);

	const encrypted = await window.crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: iv },
		key,
		fileBuffer
	);

	if (debug) console.log("encrypted:");
	if (debug) console.log(encrypted);

	const encryptedFileBlob = new Blob([new Uint8Array(encrypted)], {
		type: "application/octet-stream",
	});

	return {
		encryptedFile: encryptedFileBlob,
		salt: btoa(String.fromCharCode(...salt)),
		iv: btoa(String.fromCharCode(...iv)),
	};
}

export async function decryptFilesAESGCM(
	password,
	encryptedFile,
	saltLength,
	ivLength
) {
	try {
		const combinedBlob = await encryptedFile.arrayBuffer();
		const combined = Uint8Array(combinedBlob);

		const salt = combined.slice(0, saltLength);
		const iv = combined.slice(saltLength, saltLength + ivLength);
		const ciphertext = combined.slice(saltLength + ivLength);

		if (debug) console.log(salt);
		if (debug) console.log(iv);
		if (debug) console.log(ciphertext);

		const key = await doPBKDF2(password, salt);

		if (debug) console.log("Got key:", key);

		const decrypted = await window.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv },
			key,
			ciphertext
		);

		if (debug) console.log("Decrypted:", decrypted);
		return new Blob([decrypted]);
	} catch (error) {
		if (debug) console.error("Error while decrypting: ", error);
	}
}

export function generateSalt(saltLength) {
	return window.crypto.getRandomValues(new Uint8Array(saltLength));
}

export function generateIV(ivLength) {
	return window.crypto.getRandomValues(new Uint8Array(ivLength));
}
