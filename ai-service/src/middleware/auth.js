const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error("Missing JWT_SECRET environment variable.");
    }
    return process.env.JWT_SECRET;
}

function signToken(user) {
    return jwt.sign({ sub: user._id.toString(), role: user.role }, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
}

async function requireAuth(req, res, next) {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ success: false, error: "Authentication required." });
    }

    try {
        const payload = jwt.verify(token, getJwtSecret());
        const user = await User.findById(payload.sub).select("_id name email role status");
        if (!user || user.status !== "Active") {
            return res.status(401).json({ success: false, error: "Your account is not active." });
        }
        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, error: "Invalid or expired authentication token." });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: "You do not have permission for this action." });
        }
        return next();
    };
}

module.exports = { requireAuth, requireRole, signToken };
