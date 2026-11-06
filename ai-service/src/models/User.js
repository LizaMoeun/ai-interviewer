const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2 },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        emailVerified: { type: Boolean, default: false },
        verificationTokenHash: { type: String, select: false },
        verificationExpiresAt: { type: Date, select: false },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ["candidate", "recruiter", "admin"], required: true },
        status: { type: String, enum: ["Active", "Pending admin approval", "Rejected"], default: "Active" },
    },
    { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
