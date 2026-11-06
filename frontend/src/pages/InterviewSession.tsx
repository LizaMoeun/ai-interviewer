import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import {
  CheckCircle2,
  Clock3,
  Code2,
  MessageSquareText,
  Save,
  Send,
} from "lucide-react"
import { useNavigate } from "react-router"
import { apiPost } from "../lib/api"
import {
  fetchInterviews,
  persistSession,
  getSession,
  type CodeEvaluation,
  type Feedback,
  type InterviewQuestion,
  type SessionState,
  type SavedInterview,
} from "../lib/storage"
import {
  Badge,
  Button,
  ErrorState,
  Select,
  Skeleton,
  Textarea,
} from "../components/ui"

type FollowUp = {
  follow_up_needed: boolean
  reason: string
  follow_up_question: string | null
}

const starterCode = {
  JavaScript: `// Read input from stdin and print your answer to stdout.\nconst input = require("fs").readFileSync(0, "utf8").trim();\n\n// Write your solution here\nconsole.log(input);`,
  Python: `# Read input from stdin and print your answer to stdout.\nimport sys\ninput_value = sys.stdin.read().strip()\n\n# Write your solution here\nprint(input_value)`,
}

export default function InterviewSessionPage() {
  const navigate = useNavigate()
  const [interview, setInterview] = useState<SavedInterview | null>(null)
  const [session, setSession] = useState<SessionState>(getSession)
  const [answer, setAnswer] = useState("")
  const [language, setLanguage] = useState<"JavaScript" | "Python">(
    "JavaScript",
  )
  const [code, setCode] = useState(starterCode.JavaScript)
  const [loading, setLoading] = useState<"answer" | "code" | "report" | null>(
    null,
  )
  const [error, setError] = useState("")

  useEffect(() => {
    void fetchInterviews()
      .then((items) => {
        const next = items[0] || null
        setInterview(next)
        if (next?.session) setSession(next.session)
      })
      .catch(() => setError("Unable to load your interview."))
  }, [])

  useEffect(() => {
    if (interview) void persistSession(interview.id, session)
  }, [interview, session])

  const questions = interview?.questions || []
  const question = questions[session.current] || questions[questions.length - 1]
  const followUpQuestion = question ? session.followUps[question.id] : undefined
  const answeringFollowUp = Boolean(followUpQuestion && !session.followUpFeedback[question.id])
  const displayedQuestion = question && answeringFollowUp
    ? { ...question, question_text: followUpQuestion }
    : question
  const answerKey = question && answeringFollowUp
    ? `${question.id}:follow-up`
    : question?.id
  const progress = Math.min(
    questions.length ? ((session.current + 1) / questions.length) * 100 : 0,
    100,
  )
  const existingFeedback = question && answeringFollowUp
    ? session.followUpFeedback[question.id]
    : question ? session.feedback[question.id] : undefined
  const existingCodeResult = question ? session.codeEvaluations[question.id] : undefined

  useEffect(() => {
    if (!question) return
    setAnswer(
      answeringFollowUp
        ? session.followUpAnswers[question.id] || ""
        : session.answers[question.id] || "",
    )
  }, [answerKey, answeringFollowUp, question?.id, session.answers, session.followUpAnswers])

  if (!interview || !question || !displayedQuestion) {
    return <div className="session-page"><Skeleton rows={4} /></div>
  }

  async function submitText() {
    if (!answer.trim()) return
    setError("")
    setLoading("answer")
    const nextAnswers = { ...session.answers, [question.id]: answer }
    try {
      const feedback = await apiPost<Feedback>("/api/ai/feedback", {
        jobTitle: interview.role,
        experienceLevel: "Mid",
        question: displayedQuestion.question_text,
        idealAnswerCriteria:
          "A clear, accurate explanation with trade-offs and practical examples.",
        candidateAnswer: answer,
      })

      if (answeringFollowUp) {
        setSession((current) => ({
          ...current,
          followUpAnswers: {
            ...current.followUpAnswers,
            [question.id]: answer,
          },
          followUpFeedback: {
            ...current.followUpFeedback,
            [question.id]: feedback,
          },
        }))
      } else {
        const follow = await apiPost<FollowUp>("/api/ai/follow-up-questions", {
          jobTitle: interview.role,
          experienceLevel: "Mid",
          conversationHistory: transcript(questions, nextAnswers),
          originalQuestion: question.question_text,
          candidateAnswer: answer,
        })
        setSession((current) => ({
          ...current,
          answers: nextAnswers,
          feedback: { ...current.feedback, [question.id]: feedback },
          followUps:
            follow.follow_up_needed && follow.follow_up_question
              ? { ...current.followUps, [question.id]: follow.follow_up_question }
              : current.followUps,
        }))
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to evaluate your answer.",
      )
      setSession((current) =>
        answeringFollowUp
          ? {
              ...current,
              followUpAnswers: {
                ...current.followUpAnswers,
                [question.id]: answer,
              },
            }
          : { ...current, answers: nextAnswers },
      )
    } finally {
      setLoading(null)
    }
  }

  async function submitCode() {
    setError("")
    setLoading("code")
    try {
      const result = await apiPost<CodeEvaluation>("/api/submissions/execute", {
        candidateCode: code,
        testCases: [
          { input: "leetcode", expectedOutput: "l" },
          { input: "aabb", expectedOutput: "-1" },
        ],
        programmingLanguage: language,
        experienceLevel: "Mid",
        problemStatement: question.question_text,
      })
      setSession((current) => ({
        ...current,
        answers: { ...current.answers, [question.id]: code },
        codeEvaluations: { ...current.codeEvaluations, [question.id]: result },
      }))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to evaluate your code.",
      )
    } finally {
      setLoading(null)
    }
  }

  function next() {
    if (session.current < questions.length - 1) {
      setSession((current) => ({ ...current, current: current.current + 1 }))
    } else {
      setSession((current) => ({ ...current, completed: true }))
      navigate("/candidate/results")
    }
  }

  const hasResult =
    question.type === "coding"
      ? Boolean(existingCodeResult)
      : Boolean(existingFeedback)
  const awaitingFollowUp = Boolean(followUpQuestion && !session.followUpFeedback[question.id])

  return (
    <div className="session-page">
      <header className="session-header">
        <div>
          <span className="session-brand">InterviewAI</span>
          <span className="session-divider" />
          <strong>{interview.role}</strong>
        </div>
        <div className="session-save">
          <Save size={15} /> Progress saved{" "}
          <span>
            <Clock3 size={15} /> No time limit
          </span>
        </div>
      </header>
      <div className="session-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <main className="session-content">
        <div className="session-step">
          <span>
            Question {session.current + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="question-heading">
          <div className="question-type-icon">
            {question.type === "coding" ? (
              <Code2 size={20} />
            ) : (
              <MessageSquareText size={20} />
            )}
          </div>
          <div>
            <div className="question-meta">
              <Badge tone="blue">{question.type}</Badge>
              <span>{question.topic}</span>
              <span>{question.difficulty}</span>
            </div>
            <h1>{displayedQuestion.question_text}</h1>
          </div>
        </div>

        {question.type === "coding" ? (
          <div className="coding-area">
            <div className="coding-toolbar">
              <div>
                <strong>Your solution</strong>
                <span>Read from stdin and print the answer to stdout.</span>
              </div>
              <Select
                value={language}
                onChange={(event) => {
                  const next = event.target.value as "JavaScript" | "Python"
                  setLanguage(next)
                  setCode(starterCode[next])
                }}
              >
                <option>JavaScript</option>
                <option>Python</option>
              </Select>
            </div>
            <div className="editor-shell">
              <Editor
                height="420px"
                language={language === "JavaScript" ? "javascript" : "python"}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 18 },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
            <div className="submit-row">
              <span className="muted">
                Evaluation usually takes 5–15 seconds.
              </span>
              <Button onClick={submitCode} loading={loading === "code"}>
                {loading === "code" ? "Running your code…" : "Run & submit"}{" "}
                <Send size={16} />
              </Button>
            </div>
            {loading === "code" && <EvaluationLoading />}
            {existingCodeResult && (
              <div className="submission-status">
                <CheckCircle2 size={17} />
                <span>Your solution was submitted and saved.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="answer-area">
            <label className="field">
              <span className="label">Your answer</span>
              <Textarea
                rows={10}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Explain your reasoning clearly. Include examples or trade-offs where helpful."
              />
              <span className="answer-count">{answer.length} characters</span>
            </label>
            <div className="submit-row">
              <span className="muted">
                Your response is saved when you submit.
              </span>
              <Button
                disabled={!answer.trim()}
                onClick={submitText}
                loading={loading === "answer"}
              >
                Submit answer <Send size={16} />
              </Button>
            </div>
            {loading === "answer" && (
              <div className="thinking">
                <Skeleton rows={2} />
                <p>Reviewing your response and considering a follow-up…</p>
              </div>
            )}
            {followUpQuestion && !answeringFollowUp && (
              <div className="follow-up">
                <span>
                  <MessageSquareText size={17} /> Adaptive follow-up
                </span>
                <strong>{followUpQuestion}</strong>
              </div>
            )}
          </div>
        )}

        {error && (
          <ErrorState
            title={
              question.type === "coding"
                ? "No score was recorded"
                : "We couldn’t evaluate this answer"
            }
            message={error}
            retry={question.type === "coding" ? submitCode : submitText}
          />
        )}
        {hasResult && !awaitingFollowUp && (
          <div className="next-row">
            <div>
              <CheckCircle2 size={18} />
              <span>Your response has been submitted and saved.</span>
            </div>
            <Button onClick={next}>
              {session.current === questions.length - 1
                ? "Finish interview"
                : "Next question"}{" "}
              <Send size={16} />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

function EvaluationLoading() {
  return (
    <div className="evaluation-loading">
      <div className="loading-mark">
        <Code2 size={22} />
      </div>
      <div className="grow">
        <strong>Running your code securely</strong>
        <p>
          Executing test cases and reviewing correctness, complexity, and edge
          cases.
        </p>
        <div className="loading-line">
          <span />
        </div>
      </div>
    </div>
  )
}

function transcript(
  questions: InterviewQuestion[],
  answers: Record<string, string>,
) {
  return questions
    .filter((question) => answers[question.id])
    .map(
      (question, index) =>
        `Q${index + 1}: ${question.question_text}\nA${index + 1}: ${answers[question.id]}`,
    )
    .join("\n\n")
}
