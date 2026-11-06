const mongoose = require("mongoose");

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("Missing MONGODB_URI environment variable.");
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");
}

module.exports = { connectDatabase };
