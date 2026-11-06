const express = require("express");
const {
    listInterviews,
    createInterview,
    getInterview,
    updateSession,
    saveReport,
} = require("../controllers/interviewController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", listInterviews);
router.post("/", requireRole("recruiter", "admin"), createInterview);
router.get("/:id", getInterview);
router.patch("/:id/session", updateSession);
router.put("/:id/report", saveReport);

module.exports = router;
