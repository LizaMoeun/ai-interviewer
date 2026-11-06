const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { connectDatabase } = require("../src/config/database");
const User = require("../src/models/User");

dotenv.config();

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME?.trim() || "InterviewAI Administrator";

    if (!email || !password || password.length < 12) {
        throw new Error(
            "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before running this command.",
        );
    }

    await connectDatabase();
    const existing = await User.findOne({ email });
    if (existing) {
        if (existing.role !== "admin") {
            throw new Error("An account with this email already exists and is not an administrator.");
        }
        throw new Error("An administrator with this email already exists.");
    }

    await User.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin",
        status: "Active",
    });

    console.log(`Administrator created: ${email}`);
}

createAdmin()
    .catch((error) => {
        console.error(`Unable to create administrator: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        const mongoose = require("mongoose");
        await mongoose.disconnect();
    });
