import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Plus,
  Target,
  UserCheck,
  Users,
} from "lucide-react"
import { useAuth } from "../app/auth"
import {
  Badge,
  Button,
  Card,
  LinkButton,
  PageHeader,
  SectionTitle,
} from "../components/ui"
import { ScoreBadge } from "../components/Feedback"
import { fetchInterviews, type SavedInterview } from "../lib/storage"
import { apiPatch, apiRequest } from "../lib/api"

type CandidateRow = {
  id: string
  name: string
  role: string
  status: SavedInterview["status"]
  score: number | null
  date: string
}

function candidateRows(interviews: SavedInterview[]): CandidateRow[] {
  return interviews.map((interview) => ({
    id: interview.id,
    name: interview.candidateName || "Unassigned candidate",
    role: interview.role,
    status: interview.status,
    score: typeof (interview.report as { overall_score?: unknown } | null)?.overall_score === "number"
      ? (interview.report as { overall_score: number }).overall_score
      : null,
    date: new Date().toLocaleDateString(),
  }))
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const view = params.get("view") || "overview"
  const isAdmin = user?.role === "admin"

  if (view === "reports") return <HiringAnalytics admin={isAdmin} />
  if (isAdmin && view === "users") return <AdminUsers />
  if (isAdmin && view === "sessions") return <AdminSessions />
  if (!isAdmin && view === "candidates") return <CandidateList />
  return isAdmin ? (
    <AdminOverview />
  ) : (
    <RecruiterOverview name={user?.name || "there"} />
  )
}

function RecruiterOverview({ name }: { name: string }) {
  const [interviews, setInterviews] = useState<SavedInterview[]>([])
  useEffect(() => { void fetchInterviews().then(setInterviews) }, [])
  const completed = interviews.filter((item) => item.status === "Completed").length
  const reports = interviews.filter((item) => item.report).length
  return (
    <>
      <PageHeader
        eyebrow="Recruiter workspace"
        title={`Good morning, ${name.split(" ")[0]}`}
        description="Here’s what is happening across your interview pipeline."
        action={
          <LinkButton to="/interviews/create">
            <Plus size={17} /> Create interview
          </LinkButton>
        }
      />
      <div className="stat-grid">
        <StatCard
          icon={BriefcaseBusiness}
          label="Active interviews"
          value={String(interviews.filter((item) => item.status !== "Completed").length)}
          detail="not completed"
        />
        <StatCard
          icon={Users}
          label="Candidates"
          value={String(interviews.filter((item) => item.candidateId).length)}
          detail="assigned interviews"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion rate"
          value={interviews.length ? `${Math.round((completed / interviews.length) * 100)}%` : "—"}
          detail="completion rate"
        />
        <StatCard
          icon={UserCheck}
          label="Recommended"
          value={String(reports)}
          detail="reports available"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="span-two">
          <SectionTitle
            title="Recent candidates"
            description="Latest activity across your open roles."
            action={
              <LinkButton to="/dashboard?view=candidates" variant="ghost">
                View all <ArrowRight size={16} />
              </LinkButton>
            }
          />
          <CandidateTable compact />
        </Card>
        <Card>
          <SectionTitle
            title="Open interviews"
            description="Progress this week."
          />
          <div className="progress-list">
            {interviews.slice(0, 5).map((interview) => (
              <div key={interview.id}>
                <div className="progress-label"><strong>{interview.role}</strong><span>{interview.status}</span></div>
                <div className="progress-track"><span style={{ width: interview.status === "Completed" ? "100%" : interview.status === "In progress" ? "50%" : "0%" }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="stat-card">
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={19} />
        </span>
        <span className="positive">{detail}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-label">{label}</span>
    </Card>
  )
}

function CandidateTable({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<CandidateRow[]>([])
  useEffect(() => {
    void fetchInterviews().then((items) => {
      const next = candidateRows(items)
      setRows(compact ? next.slice(0, 4) : next)
    })
  }, [compact])
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Role</th>
            <th>Status</th>
            <th>Score</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((candidate) => (
            <tr key={candidate.id}>
              <td>
                <div className="person-cell">
                  <span className="table-avatar">
                    {candidate.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <strong>{candidate.name}</strong>
                </div>
              </td>
              <td>{candidate.role}</td>
              <td>
                <Badge
                  tone={
                    candidate.status === "Completed"
                      ? "green"
                      : candidate.status === "In progress"
                        ? "blue"
                        : "neutral"
                  }
                >
                  {candidate.status}
                </Badge>
              </td>
              <td>
                {candidate.score ? <strong>{candidate.score}</strong> : "—"}
              </td>
              <td>{candidate.date}</td>
              <td>
                <LinkButton
                  to={candidate.score ? "/candidate/results" : "/dashboard"}
                  variant="ghost"
                >
                  {candidate.score ? (
                    "View report"
                  ) : (
                    <MoreHorizontal size={17} />
                  )}
                </LinkButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CandidateList() {
  const [rows, setRows] = useState<CandidateRow[]>([])
  const [selected, setSelected] = useState<string[]>([])
  useEffect(() => {
    void fetchInterviews().then((items) => setRows(candidateRows(items)))
  }, [])
  const comparable = useMemo(
    () =>
      rows.filter((item) => selected.includes(item.id) && item.score),
    [rows, selected],
  )
  return (
    <>
      <PageHeader
        title="Candidates"
        description="Review results and compare evidence across completed interviews."
      />
      <Card>
        <SectionTitle
          title="Candidate pipeline"
          description="Select completed candidates to compare scores."
        />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Compare</th>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <input
                      aria-label={`Compare ${candidate.name}`}
                      type="checkbox"
                      disabled={!candidate.score}
                      checked={selected.includes(candidate.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, candidate.id]
                            : current.filter((id) => id !== candidate.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>{candidate.name}</strong>
                  </td>
                  <td>{candidate.role}</td>
                  <td>
                    <Badge
                      tone={candidate.status === "Completed" ? "green" : "blue"}
                    >
                      {candidate.status}
                    </Badge>
                  </td>
                  <td>{candidate.score || "—"}</td>
                  <td>
                    <LinkButton to="/candidate/results" variant="ghost">
                      View report
                    </LinkButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {comparable.length > 1 && (
        <Card>
          <SectionTitle
            title="Score comparison"
            description="A simple side-by-side view of selected candidates."
          />
          <div className="compare-grid">
            {comparable.map((candidate) => (
              <div className="compare-card" key={candidate.id}>
                <div>
                  <strong>{candidate.name}</strong>
                  <p className="muted">{candidate.role}</p>
                </div>
                <ScoreBadge score={candidate.score!} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

function AdminOverview() {
  const [interviews, setInterviews] = useState<SavedInterview[]>([])
  const [userCount, setUserCount] = useState(0)
  useEffect(() => {
    void Promise.all([
      fetchInterviews().then(setInterviews),
      apiRequest<unknown[]>("/api/auth/users").then((users) => setUserCount(users.length)),
    ])
  }, [])
  const completed = interviews.filter((item) => item.status === "Completed").length
  return (
    <>
      <PageHeader
        eyebrow="Administrator workspace"
        title="System overview"
        description="Manage access and monitor interview activity across the platform."
      />
      <div className="stat-grid">
        <StatCard
          icon={Users}
          label="Total users"
          value={String(userCount)}
          detail="registered users"
        />
        <StatCard
          icon={CalendarClock}
          label="Active sessions"
          value={String(interviews.filter((item) => item.status === "In progress").length)}
          detail="in progress"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed today"
          value={String(completed)}
          detail="completed interviews"
        />
        <StatCard
          icon={BriefcaseBusiness}
          label="Hiring teams"
          value={String(new Set(interviews.map((item) => item.recruiterId)).size)}
          detail="recruiters with interviews"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="span-two">
          <SectionTitle
            title="Recent platform activity"
            description="Latest user and interview events."
          />
          <CandidateTable />
        </Card>
        <Card>
          <SectionTitle
            title="Service monitoring"
            description="Live health monitoring needs a backend status endpoint."
          />
          <div className="status-list">
            {[
              "AI question generation",
              "Code execution",
              "Evaluation service",
              "API connectivity",
            ].map((item) => (
              <div key={item}>
                <span className="status-dot neutral" />
                <span>{item}</span>
                <strong className="status-unreported">Not reported</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function AdminUsers() {
  type AdminUser = {
    id: string
    name: string
    email: string
    role: "candidate" | "recruiter" | "admin"
    status: "Active" | "Pending admin approval" | "Rejected"
  }
  const [managedUsers, setManagedUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    void apiRequest<AdminUser[]>("/api/auth/users")
      .then(setManagedUsers)
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load users.",
        )
      })
  }, [])

  async function changeStatus(user: AdminUser, status: AdminUser["status"]) {
    setError("")
    try {
      const updated = await apiPatch<AdminUser>(
        `/api/auth/users/${user.id}/status`,
        { status },
      )
      setManagedUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the user.",
      )
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`Delete ${user.name}'s account? This cannot be undone.`)) {
      return
    }
    setError("")
    try {
      await apiRequest(`/api/auth/users/${user.id}`, { method: "DELETE" })
      setManagedUsers((current) => current.filter((item) => item.id !== user.id))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the user.",
      )
    }
  }

  return (
    <>
      <PageHeader
        title="User accounts"
        description="Approve recruiter registrations and manage access across the platform."
      />
      {error && <div className="form-error">{error}</div>}
      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((user) => (
                <tr key={user.email}>
                  <td>
                    <strong>{user.name}</strong>
                    <span className="cell-subtitle">{user.email}</span>
                  </td>
                  <td>
                    {user.role === "admin"
                      ? "Administrator"
                      : user.role === "recruiter"
                        ? "Recruiter"
                        : "Candidate"}
                  </td>
                  <td>
                    <Badge
                      tone={
                        user.status === "Active"
                          ? "green"
                          : user.status.includes("Pending")
                            ? "amber"
                            : user.status === "Rejected"
                            ? "red"  
                            : "neutral"
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td>
                    {user.status === "Pending admin approval" ? (
                      <div className="action-group">
                        <Button
                          variant="primary"
                          className="approve-button"
                          onClick={() => void changeStatus(user, "Active")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => void changeStatus(user, "Rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : user.role === "admin" ? null : (
                      <div className="action-group">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            void changeStatus(
                              user,
                              user.status === "Active" ? "Rejected" : "Active",
                            )
                          }
                        >
                          {user.status === "Active"
                            ? "Deactivate"
                            : "Reactivate"}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => void deleteUser(user)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function AdminSessions() {
  const [interviews, setInterviews] = useState<SavedInterview[]>([])
  useEffect(() => { void fetchInterviews().then(setInterviews) }, [])
  return (
    <>
      <PageHeader
        title="Interview sessions"
        description="Monitor active and recently completed sessions across the platform."
      />
      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Interview</th>
                <th>Team</th>
                <th>Status</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>{interviews.map((interview) => (
              <tr key={interview.id}>
                <td><strong>{interview.candidateName || "Unassigned candidate"}</strong></td>
                <td>{interview.role}</td>
                <td>—</td>
                <td><Badge tone={interview.status === "Completed" ? "green" : "blue"}>{interview.status}</Badge></td>
                <td>{interview.due}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function HiringAnalytics({ admin }: { admin: boolean }) {
  const [interviews, setInterviews] = useState<SavedInterview[]>([])
  useEffect(() => { void fetchInterviews().then(setInterviews) }, [])
  const completed = interviews.filter((item) => item.status === "Completed")
  const scores = completed
    .map((item) => (item.report as { overall_score?: unknown } | null)?.overall_score)
    .filter((score): score is number => typeof score === "number")
  const average = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : "—"
  const completionRate = interviews.length ? `${Math.round((completed.length / interviews.length) * 100)}%` : "—"
  return (
    <>
      <PageHeader
        title={admin ? "System reports" : "Hiring analytics"}
        description={
          admin
            ? "Platform-wide interview activity and operational insights."
            : "Trends across interviews, candidates, and hiring decisions."
        }
      />
      <div className="stat-grid">
        <StatCard
          icon={BriefcaseBusiness}
          label={admin ? "Platform interviews" : "Total interviews"}
          value={String(interviews.length)}
          detail="from persisted interviews"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion rate"
          value={completionRate}
          detail="completed interviews"
        />
        <StatCard
          icon={Target}
          label="Average score"
          value={average}
          detail="completed report average"
        />
        <StatCard
          icon={Clock3}
          label="Average duration"
          value="—"
          detail="not tracked"
        />
      </div>

      <Card><SectionTitle title="Persisted interview activity" description="Only interviews and reports stored by the backend are shown here." /><CandidateTable /></Card>
    </>
  )
}
