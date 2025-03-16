export async function encryptData(data, debug = false) {
	const chunkSize = Number.parseInt(
		process.env.REACT_APP_PUBLIC_KEY_CHUNK_SIZE
	);
	if (debug) console.log("chunkSize:", chunkSize);
	if (debug) console.log("data:", data);
	const chunks = [];
	// const bufferData = Buffer.from(data, "utf-8");
	// const encoder = new TextEncoder();
	// const bufferData = encoder.encode(data);
	for (let i = 0; i < data.length; i += chunkSize) {
		const chunk = data.slice(i, i + chunkSize);
		if (debug) console.log("chunk:", chunk);
		const encryptedChunk = await encryptDataChunk(chunk, debug);
		if (debug) console.log("encryptedChunk: ", encryptedChunk, "index:", i);
		chunks.push(encryptedChunk);
	}
	if (debug) console.log("chunks:", chunks);
	return chunks.join("|");
}

export async function encryptDataChunk(data, debug = false) {
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
	let encryptedData = "";
	if (debug) console.log("in6!", publicKey);
	if (debug)
		console.log(new TextEncoder().encode(JSON.stringify(data)).length);
	try {
		encryptedData = await window.crypto.subtle.encrypt(
			{ name: "RSA-OAEP" },
			publicKey,
			new TextEncoder().encode(JSON.stringify(data))
		);
		if (debug) console.log(encryptedData);
	} catch (error) {
		console.error(error);
		return null;
	}
	if (debug) console.log("in7!");
	const base64EncryptedData = btoa(
		String.fromCharCode.apply(null, new Uint8Array(encryptedData))
	);
	return base64EncryptedData;
}
