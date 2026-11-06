const express = require("express");
const router = express.Router();

const {
    generateQuestions,
    generateResumeInterviewQuestions,
    generateJobDescriptionQuestions,
    generateFollowUpQuestions,
    generateFeedback,
    generateFinalReport,
} = require("../controllers/aiController");
const { validateRequest } = require("../utils/validateRequest");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

/**
 * @swagger
 * /api/ai/questions:
 *   post:
 *     summary: Generate technical interview questions
 *     tags: [AI-001 Technical Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobTitle: { type: string, example: "Backend Developer" }
 *               experienceLevel: { type: string, example: "Mid" }
 *               techStack: { type: array, items: { type: string }, example: ["Node.js", "Express", "PostgreSQL"] }
 *               difficulty: { type: string, example: "Medium" }
 *               questionType: { type: string, example: "Mixed" }
 *               questionCount: { type: integer, example: 3 }
 *     responses:
 *       200:
 *         description: Generated questions
 */
router.post("/questions", validateRequest("technicalQuestions"), generateQuestions);

/**
 * @swagger
 * /api/ai/resume-questions:
 *   post:
 *     summary: Generate questions based on a candidate's resume
 *     tags: [AI-002 Resume Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobTitle: { type: string, example: "Backend Developer" }
 *               experienceLevel: { type: string, example: "Mid" }
 *               resume: { type: string, example: "Built a real-time chat app using Socket.IO and Redis..." }
 *               focusAreas: { type: string, example: "projects, technical decisions" }
 *               questionCount: { type: integer, example: 2 }
 *     responses:
 *       200:
 *         description: Generated questions grounded in resume content
 */
router.post("/resume-questions", validateRequest("resumeQuestions"), generateResumeInterviewQuestions);

/**
 * @swagger
 * /api/ai/job-description-questions:
 *   post:
 *     summary: Generate questions mapped to a job description
 *     tags: [AI-003 Job Description Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobDescription: { type: string, example: "We are looking for a Backend Developer..." }
 *               experienceLevel: { type: string, example: "Mid" }
 *               questionType: { type: string, example: "Mixed" }
 *               questionCount: { type: integer, example: 3 }
 *     responses:
 *       200:
 *         description: Generated questions, each mapped to a job requirement
 */
router.post("/job-description-questions", validateRequest("jobDescriptionQuestions"), generateJobDescriptionQuestions);

/**
 * @swagger
 * /api/ai/follow-up-questions:
 *   post:
 *     summary: Decide whether a follow-up question is needed, and generate one if so
 *     tags: [AI-004 Follow-up Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobTitle: { type: string, example: "Backend Developer" }
 *               experienceLevel: { type: string, example: "Mid" }
 *               conversationHistory: { type: string, example: "Q1: ...\nA1: ..." }
 *               originalQuestion: { type: string, example: "What is the difference between PUT and PATCH?" }
 *               candidateAnswer: { type: string, example: "PUT updates something and PATCH also updates something..." }
 *     responses:
 *       200:
 *         description: follow_up_needed (boolean), reason, and follow_up_question (string or null)
 */
router.post("/follow-up-questions", validateRequest("followUpQuestions"), generateFollowUpQuestions);

/**
 * @swagger
 * /api/ai/feedback:
 *   post:
 *     summary: Generate structured feedback on a candidate's verbal/theoretical answer
 *     tags: [AI-006 Answer Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobTitle: { type: string, example: "Backend Developer" }
 *               experienceLevel: { type: string, example: "Mid" }
 *               question: { type: string, example: "Explain how indexing works in PostgreSQL..." }
 *               idealAnswerCriteria: { type: string, example: "B-tree structure, write/insert overhead trade-off..." }
 *               candidateAnswer: { type: string, example: "Indexes make queries faster..." }
 *     responses:
 *       200:
 *         description: score, strengths, weaknesses, feedback, missed_key_points
 */
router.post("/feedback", validateRequest("feedback"), generateFeedback);

/**
 * @swagger
 * /api/ai/final-report:
 *   post:
 *     summary: Synthesize all interview evaluations into a final hiring report
 *     tags: [AI-007 Final Report]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateName: { type: string, example: "Alex Chen" }
 *               jobTitle: { type: string, example: "Backend Developer" }
 *               experienceLevel: { type: string, example: "Mid" }
 *               interviewTranscript: { type: string, example: "Q1: ...\nA1: ..." }
 *               perQuestionFeedback: { type: array, items: { type: object } }
 *               codeEvaluations: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: overall_score, recommendation, strengths, weaknesses, summary
 */
router.post("/final-report", validateRequest("finalReport"), generateFinalReport);

module.exports = router;