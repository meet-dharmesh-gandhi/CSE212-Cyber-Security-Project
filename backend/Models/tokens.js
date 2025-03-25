const mongoose = require("mongoose");
const { Schema } = mongoose;

const TokenSchema = new Schema({
	token: { type: String, required: true, unique: true },
	createdAt: { type: Date, required: true },
	state: { type: String, enum: ["approved", "waiting"], required: true },
});

module.exports = {
	token: mongoose.model("Token", TokenSchema),
};
