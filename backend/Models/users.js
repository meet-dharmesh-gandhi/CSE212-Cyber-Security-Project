const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true },
	passwordHash: { type: String, required: false },
});

module.exports = {
	user: mongoose.model("User", UserSchema),
};
