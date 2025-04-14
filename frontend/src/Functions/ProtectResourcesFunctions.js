import { debug } from "../constants/Mode";
import { backendUrl } from "../constants/Urls";
import { doPBKDF2, encryptFilesAESGCM } from "./cryptoFunctions";
import { formatBytes } from "./utilityFunctions";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function uploadFilesToCloudinary(files, password) {
	const formData = new FormData();

	for (const file of files) {
		const { encryptedFile, salt, iv } = await encryptFilesAESGCM(
			password,
			file
		);
		const [name, extension] = file.name.split(/\.(?=[^.]+$)/);
		const size = formatBytes(file.size);
		formData.append("files", encryptedFile, name);
		formData.append(name, JSON.stringify({ extension, salt, iv, size }));
	}

	const status = await fetch(backendUrl + "/save-file", {
		method: "POST",
		body: formData,
		credentials: "include",
	}).then((data) => data.json());

	if (status.status && status.status === "success") {
		console.log("File Uploaded!");
		if (debug) console.log(status);
	} else console.log("Error in file Uploading!");
}

export async function downloadFilesFromCloudinary(files, password) {
	const zip = new JSZip();
	for (const file of files) {
		if (debug) console.log(file);
		const [fileBlob, fileName] = await downloadFileFromCloudinary(
			file,
			password
		);
		if (fileBlob === null || fileName === null) {
			console.log("The file does not exist!", file.file);
			continue;
		}
		zip.file(fileName, fileBlob);
	}

	const content = await zip.generateAsync({ type: "blob" });
	saveAs(content, "Cyber Tools.zip");
}

export async function downloadFileFromCloudinary(file, password) {
	const {
		cloudinaryUrl,
		extension,
		fileName,
		iv: base64EncodedIv,
		salt: base64EncodedSalt,
	} = file;
	if (debug) console.log(base64EncodedIv, base64EncodedSalt);
	const encryptedFile = await fetch(cloudinaryUrl).then((data) =>
		data.status === 200 ? data.arrayBuffer() : false
	);
	if (encryptedFile === false) {
		return [null, null];
	}
	const iv = Uint8Array.from(atob(base64EncodedIv), (c) => c.charCodeAt(0));
	const salt = Uint8Array.from(atob(base64EncodedSalt), (c) =>
		c.charCodeAt(0)
	);

	const key = await doPBKDF2(password, salt);

	let buffer;
	try {
		buffer = await window.crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv,
			},
			key,
			encryptedFile
		);
	} catch (error) {
		console.error("Error while decoding the data:", error);
		throw new Error(
			"Error while decoding the data (the password might be invalid as well)"
		);
	}

	const blob = new Blob([buffer]);
	return [blob, `${fileName}.${extension}`];
}

export async function deleteFileFromCloudinary(file) {
	const fileName = file.fileName;
	const cloudinaryUrl = file.cloudinaryUrl;

	console.log(file);
	console.log(fileName);
	console.log(cloudinaryUrl);

	const deleteFile = await fetch(backendUrl + "/delete-user-files", {
		method: "delete",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({
			fileName,
			cloudinaryUrl,
		}),
	})
		.then((data) => data.json())
		.then((data) => {
			if (data.status === "error") {
				console.error("Could not delete the file from cloudinary!");
				return false;
			} else {
				console.log("File deleted successfully!");
				return true;
			}
		});
	return deleteFile;
}
