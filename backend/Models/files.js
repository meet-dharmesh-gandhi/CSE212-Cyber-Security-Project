const mongoose = require("mongoose");
const { Schema } = mongoose;

const FilesManagerSchema = new Schema({
	username: { type: String, required: true },
	fileName: { type: String, required: true },
	extension: { type: String, required: true },
	iv: { type: String, required: true },
	salt: { type: String, required: true },
	cloudinaryUrl: { type: String, required: true },
	dateUploaded: { type: Date, required: true, ["default"]: Date.now },
	size: { type: String, required: false },
});

module.exports = {
	files: mongoose.model("files", FilesManagerSchema),
};
