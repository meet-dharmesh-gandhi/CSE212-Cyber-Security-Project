const cloudinary = require("../Database/cloudinary");

async function uploadFileToCloudinary(buffer, filename) {
	return await cloudinary.uploader
		.upload_stream(
			{
				resource_type: "raw",
				public_id: filename,
			},
			(err, result) => {
				if (err) console.error("Error while uploading to cloudinary");
				else console.log("File uploaded to cloudinary!");
			}
		)
		.end(buffer);
}

function extractCloudinaryPublicId(cloudinaryUrl) {
	const parts = cloudinaryUrl.split("/upload/");
	if (parts.length < 2) throw new Error("Invalid Cloudinary URL");

	const pathParts = parts[1].split("/").slice(1);

	return pathParts.join("/");
}

module.exports = {
	uploadFileToCloudinary,
	extractCloudinaryPublicId,
};
