const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Interview = require("../models/Interview");
const { signToken } = require("../middleware/auth");
const { sendVerificationEmail } = require("../services/emailService");

function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    };
}

async function register(req, res) {
    const { name, email, password, role } = req.body;
    if (!name || name.trim().length < 2 || !email || !password || password.length < 8) {
        return res.status(400).json({ success: false, error: "Name, email, and a password of at least 8 characters are required." });
    }
    if (!["candidate", "recruiter"].includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid registration role." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        return res.status(409).json({ success: false, error: "An account with that email already exists." });
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role,
        status: role === "recruiter" ? "Pending admin approval" : "Active",
        emailVerified: role === "recruiter",
    });

    if (role === "candidate") {
        const token = crypto.randomBytes(32).toString("hex");
        user.verificationTokenHash = crypto.createHash("sha256").update(token).digest("hex");
        user.verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
        try {
            await sendVerificationEmail({ email: user.email, name: user.name, token });
        } catch (error) {
            await User.deleteOne({ _id: user._id });
            return res.status(503).json({
                success: false,
                error: `Account email could not be sent: ${error.message}`,
            });
        }
    }

    const data = {
        user: publicUser(user),
        status: user.status,
    };
    if (user.status === "Active" && user.emailVerified) data.token = signToken(user);

    return res.status(201).json({
        success: true,
        data,
    });
}

async function login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
    }
    if (user.status !== "Active") {
        return res.status(403).json({
            success: false,
            error: user.status === "Pending admin approval"
                ? "Your recruiter account is waiting for administrator approval."
                : "This account is not active.",
        });
    }
    if (user.role === "candidate" && !user.emailVerified) {
        return res.status(403).json({ success: false, error: "Verify your email address before signing in." });
    }

    return res.json({ success: true, data: { token: signToken(user), user: publicUser(user) } });
}

async function verifyEmail(req, res) {
    const token = String(req.query.token || "");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        verificationTokenHash: tokenHash,
        verificationExpiresAt: { $gt: new Date() },
        role: "candidate",
    }).select("+verificationTokenHash +verificationExpiresAt");
    if (!user) {
        return res.status(400).json({ success: false, error: "This verification link is invalid or expired." });
    }
    user.emailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationExpiresAt = undefined;
    await user.save();
    return res.json({ success: true, data: { message: "Email verified. You can now sign in." } });
}

async function currentUser(req, res) {
    return res.json({ success: true, data: publicUser(req.user) });
}

async function listUsers(req, res) {
    const users = await User.find()
        .select("_id name email role status createdAt")
        .sort({ createdAt: -1 });
    return res.json({ success: true, data: users.map(publicUser) });
}

async function updateUserStatus(req, res) {
    const allowedStatuses = ["Active", "Pending admin approval", "Rejected"];
    if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, error: "Invalid user status." });
    }

    async function deleteUser(req, res) {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, error: "You cannot delete your own account." });
        }

        const user = await User.findById(req.params.id).select("_id role");
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }
        if (user.role === "admin") {
            return res.status(403).json({ success: false, error: "Administrator accounts cannot be deleted here." });
        }

        if (user.role === "recruiter") {
            await Interview.deleteMany({ recruiterId: user._id });
        } else {
            await Interview.updateMany(
                { candidateId: user._id },
                { $set: { candidateId: null } },
            );
        }
        await User.deleteOne({ _id: user._id });
        return res.json({ success: true, data: { id: user._id.toString() } });
    }
    if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({ success: false, error: "You cannot change your own account status." });
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true },
    );
    if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
    }
    return res.json({ success: true, data: publicUser(user) });
}

module.exports = {
    register,
    login,
    currentUser,
    verifyEmail,
    listUsers,
    updateUserStatus,
    deleteUser,
};
