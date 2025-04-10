const mongoose = require("mongoose");
const { Schema } = mongoose;

const PasswordManagerSchema = new Schema({
	username: { type: String, required: true },
	passwords: { type: String, required: true },
	initialized: { type: Boolean, required: true, ["default"]: false },
	passwordHash: { type: String, required: true },
});

module.exports = {
	passwordManager: mongoose.model("PasswordManager", PasswordManagerSchema),
};
