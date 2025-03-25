const mongoose = require("mongoose");
const { Schema } = mongoose;

const OTPSchema = new Schema({
	OTP: { type: String, required: true, unique: true },
	createdAt: { type: Date, required: true },
});

module.exports = {
	otp: mongoose.model("OTP", OTPSchema),
};
