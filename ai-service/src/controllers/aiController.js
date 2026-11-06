const {
    generateInterviewQuestions,
    generateResumeQuestions,
    generateJobDescriptionQuestions: generateJobDescriptionQuestionsService,
    generateFollowUpQuestions: generateFollowUpQuestionsService,
    generateCodeEvaluation: generateCodeEvaluationService,
    generateFeedback: generateFeedbackService,
    generateFinalReport: generateFinalReportService,
} = require("../services/aiService");
const { toCandidateReport } = require("../utils/reportAccess");

const generateQuestions = async (req, res) => {
    try {
        const result = await generateInterviewQuestions(req.body);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

const generateResumeInterviewQuestions = async (req, res) => {
    try {
        const result = await generateResumeQuestions(req.body);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

const generateJobDescriptionQuestions = async (req, res) => {
    try {
        const result = await generateJobDescriptionQuestionsService(req.body);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

const generateFollowUpQuestions = async (req, res) => {
    try {
        const result = await generateFollowUpQuestionsService(req.body);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};
const generateCodeEvaluation = async (req, res) => {
    try {
        const result = await generateCodeEvaluationService(req.body);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const generateFeedback = async (req, res) => {
    try {
        const result = await generateFeedbackService(req.body);

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

const generateFinalReport = async (req, res) => {
    try {
        const result = await generateFinalReportService(req.body);
        const data = req.user.role === "candidate" ? toCandidateReport(result) : result;

        res.json({
            success: true,
            data,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

module.exports = {
    generateQuestions,
    generateResumeInterviewQuestions,
    generateJobDescriptionQuestions,
    generateFollowUpQuestions,
    generateCodeEvaluation,
    generateFeedback,
    generateFinalReport,
};