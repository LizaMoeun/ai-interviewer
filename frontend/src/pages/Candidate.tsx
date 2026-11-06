import { useEffect, useState } from "react"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  PlayCircle,
} from "lucide-react"
import { useAuth } from "../app/auth"
import {
  Badge,
  Card,
  LinkButton,
  PageHeader,
  SectionTitle,
} from "../components/ui"
import { fetchInterviews, type SavedInterview } from "../lib/storage"

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState<SavedInterview[]>([])

  useEffect(() => {
    void fetchInterviews()
      .then(setInterviews)
      .catch(() => setInterviews([]))
  }, [])

  const active = interviews.filter((item) => item.status !== "Completed")
  const completed = interviews.filter((item) => item.status === "Completed")

  return (
    <>
      <PageHeader
        eyebrow="Candidate home"
        title={`Welcome, ${user?.name?.split(" ")[0] || "Candidate"}`}
        description="Your interviews, progress, and feedback are all in one place."
      />
      <Card className="candidate-intro">
        <div className="candidate-intro-icon">
          <PlayCircle size={24} />
        </div>
        <div className="grow">
          <h2>
            {active.length
              ? "You have an interview ready"
              : "You’re all caught up"}
          </h2>
          <p>
            {active.length
              ? "Find a quiet place, check your connection, and allow enough time to complete it in one sitting."
              : "Any new interview invitations will appear here."}
          </p>
        </div>
        {active.length > 0 && (
          <LinkButton to="/candidate/interview">
            {active[0].status === "In progress"
              ? "Resume interview"
              : "Start interview"}{" "}
            <ArrowRight size={17} />
          </LinkButton>
        )}
      </Card>

      <section className="candidate-section">
        <SectionTitle
          title="Your interviews"
          description="Invitations that need your attention."
        />
        <div className="interview-card-list">
          {active.map((interview) => (
            <Card className="interview-card" key={interview.id}>
              <div className="interview-card-main">
                <div className="company-mark">IA</div>
                <div>
                  <div className="inline-actions">
                    <h3>{interview.title}</h3>
                    <Badge
                      tone={
                        interview.status === "In progress" ? "blue" : "amber"
                      }
                    >
                      {interview.status}
                    </Badge>
                  </div>
                  <p className="muted">InterviewAI hiring team</p>
                  <div className="interview-details">
                    <span>
                      <Clock3 size={15} /> About 35 minutes
                    </span>
                    <span>
                      <Calendar size={15} /> {interview.due}
                    </span>
                    <span>{interview.questions.length} questions</span>
                  </div>
                </div>
              </div>
              <LinkButton to="/candidate/interview" variant="secondary">
                {interview.status === "In progress" ? "Resume" : "View details"}{" "}
                <ArrowRight size={16} />
              </LinkButton>
            </Card>
          ))}
        </div>
      </section>

      <section className="candidate-section">
        <SectionTitle
          title="Interview history"
          description="Completed interviews and available feedback."
        />
        {completed.length ? (
          <div className="interview-card-list">
            {completed.map((interview) => (
              <Card className="interview-card" key={interview.id}>
                <div className="interview-card-main">
                  <div className="company-mark complete">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3>{interview.title}</h3>
                    <p className="muted">
                      Completed recently · Feedback available
                    </p>
                  </div>
                </div>
                <LinkButton to="/candidate/results" variant="secondary">
                  View feedback
                </LinkButton>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="history-empty">
            <CheckCircle2 size={22} />
            <div>
              <strong>No completed interviews yet</strong>
              <p className="muted">
                Your interview history and feedback will appear here.
              </p>
            </div>
          </Card>
        )}
      </section>
    </>
  )
}
