import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Award, CheckCircle2, Lightbulb, Target } from "lucide-react"
import { Link, useLocation } from "react-router"
import { useAuth } from "../app/auth"
import { apiPost } from "../lib/api"
import {
  fetchInterviews,
  persistReport,
  type SavedInterview,
  type SessionState,
} from "../lib/storage"
import {
  Badge,
  Card,
  ErrorState,
  PageHeader,
  SectionTitle,
  Skeleton,
} from "../components/ui"
import { ScoreBadge } from "../components/Feedback"

type Report = {
  candidate_name: string
  job_title: string
  overall_score: number
  technical_evaluation: string
  communication_evaluation: string
  strengths: string[]
  weaknesses: string[]
  recommendation?: "Strong Hire" | "Hire" | "Lean Hire" | "No Hire" | "Strong No Hire"
  recommendation_justification?: string
  summary: string
}

export default function ResultsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const candidateView = location.pathname.startsWith("/candidate")
  const [interview, setInterview] = useState<SavedInterview | null>(null)
  const [session, setSession] = useState<SessionState | null>(null)
  const [report, setReport] = useState<Report | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const requested = useRef(false)

  useEffect(() => {
    void fetchInterviews()
      .then((items) => {
        const next = items[0]
        setInterview(next || null)
        setSession(next?.session || null)
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the interview.",
        )
        setLoading(false)
      })
  }, [])

  async function generate() {
    if (!interview || !session) return
    if (!session.completed) {
      setError("Complete the interview before viewing a report.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const result = await apiPost<Report>("/api/ai/final-report", {
        candidateName: user?.name || "Candidate",
        jobTitle: interview.role,
        experienceLevel: "Mid",
        interviewTranscript: interview.questions
          .flatMap((question, index) => {
            const exchanges = [
              `Q${index + 1}: ${question.question_text}\nA${index + 1}: ${session.answers[question.id] || "No answer"}`,
            ]
            const followUp = session.followUps[question.id]
            if (followUp) {
              exchanges.push(
                `Follow-up ${index + 1}: ${followUp}\nFollow-up answer: ${session.followUpAnswers[question.id] || "No answer"}`,
              )
            }
            return exchanges
          })
          .join("\n\n"),
        perQuestionFeedback: Object.values(session.feedback).map((item) => ({
          score: item.score,
          missed_key_points: item.missed_key_points,
        })),
        codeEvaluations: Object.values(session.codeEvaluations).map((item) => ({
          score: item.score,
          correctness: item.correctness,
          edge_cases_missed: item.edge_cases_missed,
        })),
      })
      setReport(result)
      await persistReport(interview.id, result)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to build the final report.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.completed && !requested.current) {
      requested.current = true
      void generate()
    }
  }, [session])

  if (loading) {
    return (
      <div className="report-loading">
        <Award size={26} />
        <h2>Preparing your interview feedback</h2>
        <p>
          We’re combining your answers and code evaluations into a clear report.
        </p>
        <Skeleton rows={5} />
      </div>
    )
  }
  if (error)
    return (
      <div className="results-wrap">
        <ErrorState message={error} retry={generate} />
      </div>
    )
  if (!report || !interview || !session) return null

  const recommendationTone = report.recommendation?.includes("No")
    ? "red"
    : report.recommendation === "Lean Hire"
      ? "amber"
      : "green"

  return (
    <div className="results-wrap">
      <Link
        className="back-link"
        to={candidateView ? "/candidate" : "/dashboard"}
      >
        <ArrowLeft size={16} /> Back to{" "}
        {candidateView ? "interviews" : "dashboard"}
      </Link>
      <PageHeader
        eyebrow={candidateView ? "Your interview feedback" : "Candidate report"}
        title={
          candidateView
            ? `Great work, ${user?.name?.split(" ")[0] || "there"}`
            : report.candidate_name
        }
        description={
          candidateView
            ? "Here is a summary of your performance and opportunities to keep growing."
            : `${report.job_title} · Completed technical interview`
        }
      />
      <Card className="report-hero">
        <div className="report-score">
          <ScoreBadge score={report.overall_score} />
          <div>
            <span className="hint">Overall score</span>
            <strong>
              {report.overall_score >= 80
                ? "Strong performance"
                : "Solid foundation"}
            </strong>
            <p>{report.summary}</p>
          </div>
        </div>
        {!candidateView && (
          <div className="recommendation-panel">
            <span className="hint">Recommendation</span>
            <Badge tone={recommendationTone}>{report.recommendation}</Badge>
            <p>{report.recommendation_justification}</p>
          </div>
        )}
      </Card>
      <div className="report-grid">
        <Card>
          <SectionTitle
            title="Your strengths"
            action={
              <span className="report-icon success">
                <Award size={19} />
              </span>
            }
          />
          <ul className="report-list">
            {report.strengths.map((item) => (
              <li key={item}>
                <CheckCircle2 size={17} />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle
            title="Growth opportunities"
            action={
              <span className="report-icon amber">
                <Lightbulb size={19} />
              </span>
            }
          />
          <ul className="report-list growth">
            {report.weaknesses.map((item) => (
              <li key={item}>
                <Target size={17} />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <SectionTitle
          title="Detailed evaluation"
          description="A closer look at your interview performance."
        />
        <div className="evaluation-grid">
          <div>
            <span className="label">Technical evaluation</span>
            <p>{report.technical_evaluation}</p>
          </div>
          <div>
            <span className="label">Communication</span>
            <p>{report.communication_evaluation}</p>
          </div>
        </div>
      </Card>
      {candidateView && (
        <div className="candidate-report-note">
          <CheckCircle2 size={18} />
          <p>
            <strong>What happens next?</strong> The hiring team will review your
            complete interview. They’ll contact you directly with any next
            steps.
          </p>
        </div>
      )}
    </div>
  )
}
