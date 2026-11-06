const express = require("express");
const router = express.Router();

const { submitCode } = require("../controllers/submissionController");
const { validateRequest } = require("../utils/validateRequest");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

/**
 * @swagger
 * /api/submissions/execute:
 *   post:
 *     summary: Run candidate code in a Docker sandbox and get an AI evaluation
 *     tags: [AI-005 Code Evaluation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateCode: { type: string, example: "const readline = require('readline')..." }
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input: { type: string, example: "leetcode" }
 *                     expectedOutput: { type: string, example: "l" }
 *               programmingLanguage: { type: string, example: "JavaScript" }
 *               experienceLevel: { type: string, example: "Junior" }
 *               problemStatement: { type: string, example: "Write a function that returns the first non-repeating character..." }
 *     responses:
 *       200:
 *         description: score, correctness, strengths, weaknesses, edge_cases_missed, code_feedback
 */
router.post("/execute", validateRequest("codeSubmission"), submitCode);

module.exports = router;