const Interview = require("../models/Interview");
const User = require("../models/User");
const { toCandidateReport } = require("../utils/reportAccess");

function serializeInterview(interview, role) {
    const value = interview.toObject
        ? interview.toObject({ flattenMaps: true })
        : interview;
    const { candidateReport, recruiterReport, ...publicValue } = value;
    return {
        ...publicValue,
        id: value._id.toString(),
        recruiterId: value.recruiterId?.toString(),
        candidateId: value.candidateId?.toString() || null,
        candidateName: typeof value.candidateId === "object" ? value.candidateId.name : null,
        report: role === "candidate" ? candidateReport : recruiterReport,
    };
}

function accessFilter(req) {
    return req.user.role === "candidate"
        ? { candidateId: req.user._id }
        : req.user.role === "admin" ? {} : { recruiterId: req.user._id };
}

async function listInterviews(req, res) {
    const interviews = await Interview.find(accessFilter(req))
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 });
    return res.json({ success: true, data: interviews.map((item) => serializeInterview(item, req.user.role)) });
}

async function createInterview(req, res) {
    const { title, role, due, questions, candidateId, candidateEmail } = req.body;
    if (!title || !role || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, error: "Title, role, and at least one question are required." });
    }
    const candidate = candidateId
        ? await User.findOne({ _id: candidateId, role: "candidate" }).select("_id")
        : candidateEmail
            ? await User.findOne({ email: candidateEmail.trim().toLowerCase(), role: "candidate" }).select("_id")
            : null;
    if (candidateEmail && !candidate) {
        return res.status(404).json({ success: false, error: "No candidate account was found for that email." });
    }

    const interview = await Interview.create({
        recruiterId: req.user._id,
        candidateId: candidate?._id || null,
        title,
        role,
        due,
        questions,
    });
    return res.status(201).json({ success: true, data: serializeInterview(interview, req.user.role) });
}

async function getInterview(req, res) {
    const interview = await Interview.findOne({ _id: req.params.id, ...accessFilter(req) })
        .populate("candidateId", "name email");
    if (!interview) {
        return res.status(404).json({ success: false, error: "Interview not found." });
    }
    return res.json({ success: true, data: serializeInterview(interview, req.user.role) });
}

async function updateSession(req, res) {
    const interview = await Interview.findOne({ _id: req.params.id, ...accessFilter(req) });
    if (!interview) {
        return res.status(404).json({ success: false, error: "Interview not found." });
    }
    interview.session = {
        ...interview.session.toObject({ flattenMaps: true }),
        ...req.body,
    };
    interview.status = interview.session.completed
        ? "Completed"
        : Object.keys(interview.session.answers || {}).length > 0
            ? "In progress"
            : "Not started";
    await interview.save();
    return res.json({ success: true, data: { session: interview.session, status: interview.status } });
}

async function saveReport(req, res) {
    const interview = await Interview.findOne({ _id: req.params.id, ...accessFilter(req) });
    if (!interview) {
        return res.status(404).json({ success: false, error: "Interview not found." });
    }
    if (req.user.role === "candidate") {
        interview.candidateReport = toCandidateReport(req.body);
    } else {
        interview.recruiterReport = req.body;
    }
    await interview.save();
    return res.json({
        success: true,
        data: req.user.role === "candidate" ? interview.candidateReport : interview.recruiterReport,
    });
}

module.exports = {
    listInterviews,
    createInterview,
    getInterview,
    updateSession,
    saveReport,
};
