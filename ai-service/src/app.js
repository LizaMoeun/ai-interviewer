const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./config/swagger");

const app = express();

const aiRoutes = require("./routes/aiRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:4000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_ORIGIN) {
    throw new Error("FRONTEND_ORIGIN must be configured in production.");
}

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Origin is not allowed by CORS."));
        },
    }),
);
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/submissions", submissionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Hello from the backend!" });
});

module.exports = app;