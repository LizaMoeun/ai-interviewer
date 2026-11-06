const express = require("express");
const {
    register,
    login,
    currentUser,
    verifyEmail,
    listUsers,
    updateUserStatus,
    deleteUser,
} = require("../controllers/authController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.get("/me", requireAuth, currentUser);
router.get("/users", requireAuth, requireRole("admin"), listUsers);
router.patch("/users/:id/status", requireAuth, requireRole("admin"), updateUserStatus);
router.delete("/users/:id", requireAuth, requireRole("admin"), deleteUser);

module.exports = router;
