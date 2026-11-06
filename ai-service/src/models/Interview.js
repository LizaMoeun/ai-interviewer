const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: { type: String, enum: ["theoretical", "coding", "design"], required: true },
        topic: { type: String, required: true },
        difficulty: String,
        question_text: { type: String, required: true },
        estimated_time: String,
        based_on: String,
        maps_to_requirement: String,
    },
    { _id: false },
);

const sessionSchema = new mongoose.Schema(
    {
        current: { type: Number, default: 0 },
        answers: { type: Map, of: String, default: {} },
        feedback: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
        codeEvaluations: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
        followUps: { type: Map, of: String, default: {} },
        followUpAnswers: { type: Map, of: String, default: {} },
        followUpFeedback: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
        completed: { type: Boolean, default: false },
    },
    { _id: false },
);

const interviewSchema = new mongoose.Schema(
    {
        recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
        title: { type: String, required: true, trim: true },
        role: { type: String, required: true, trim: true },
        status: { type: String, enum: ["Not started", "In progress", "Completed"], default: "Not started" },
        due: { type: String, default: "Invitation ready to send" },
        questions: { type: [questionSchema], required: true, validate: (items) => items.length > 0 },
        session: { type: sessionSchema, default: () => ({}) },
        candidateReport: { type: mongoose.Schema.Types.Mixed, default: null },
        recruiterReport: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Interview", interviewSchema);
