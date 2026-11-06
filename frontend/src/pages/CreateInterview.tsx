import { useState, type FormEvent } from "react"
import { ArrowLeft, GripVertical, Plus, Sparkles, Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { apiPost } from "../lib/api"
import { createInterview, type InterviewQuestion } from "../lib/storage"
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SectionTitle,
  Select,
  Skeleton,
  Textarea,
} from "../components/ui"

type Mode = "technical" | "resume" | "job" | "custom"

function appendQuestions(
  current: InterviewQuestion[],
  incoming: InterviewQuestion[],
) {
  const usedIds = new Set(current.map((question) => question.id))

  return [
    ...current,
    ...incoming.map((question) => {
      const incomingId =
        typeof question.id === "string" && question.id.length > 0
          ? question.id
          : null
      let id = incomingId

      if (!id || usedIds.has(id)) {
        do {
          id = crypto.randomUUID()
        } while (usedIds.has(id))
      }

      usedIds.add(id)
      return { ...question, id }
    }),
  ]
}

export default function CreateInterviewPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("technical")
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastForm, setLastForm] = useState<HTMLFormElement | null>(null)

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLastForm(event.currentTarget)
    setLoading(true)
    setError("")
    const data = new FormData(event.currentTarget)
    try {
      let result: { questions: InterviewQuestion[] }
      if (mode === "resume") {
        result = await apiPost("/api/ai/resume-questions", {
          jobTitle: data.get("jobTitle"),
          experienceLevel: data.get("experienceLevel"),
          resume: data.get("resume"),
          focusAreas: data.get("focusAreas"),
          questionCount: Number(data.get("questionCount")),
        })
      } else if (mode === "job") {
        result = await apiPost("/api/ai/job-description-questions", {
          jobDescription: data.get("jobDescription"),
          experienceLevel: data.get("experienceLevel"),
          questionType: data.get("questionType"),
          questionCount: Number(data.get("questionCount")),
        })
      } else {
        result = await apiPost("/api/ai/questions", {
          jobTitle: data.get("jobTitle"),
          experienceLevel: data.get("experienceLevel"),
          techStack: String(data.get("techStack"))
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          difficulty: data.get("difficulty"),
          questionType: data.get("questionType"),
          questionCount: Number(data.get("questionCount")),
        })
      }
      setQuestions((current) => appendQuestions(current, result.questions))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate questions.",
      )
    } finally {
      setLoading(false)
    }
  }

  function addCustom() {
    setQuestions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "theoretical",
        topic: "Custom",
        question_text: "Write your custom question here.",
      },
    ])
  }

  async function save() {
    const jobTitleElement = lastForm?.elements.namedItem("jobTitle")
    try {
      await createInterview({
      title: `${
        jobTitleElement instanceof HTMLInputElement
          ? jobTitleElement.value
          : "Technical"
      } Interview`,
      role:
        jobTitleElement instanceof HTMLInputElement
          ? jobTitleElement.value
          : "Technical role",
      due: "Invitation ready to send",
      candidateEmail:
        String(lastForm?.elements.namedItem("candidateEmail")?.value || "").trim() ||
        undefined,
      questions,
      })
      navigate("/dashboard")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the interview.",
      )
    }
  }

  return (
    <>
      <button className="back-link" onClick={() => navigate("/dashboard")}>
        <ArrowLeft size={16} /> Back to dashboard
      </button>
      <PageHeader
        title="Create an interview"
        description="Build a structured interview from AI-generated and custom questions."
      />
      <div className="create-layout">
        <form className="create-form" onSubmit={generate}>
          <Card>
            <SectionTitle
              title="Interview details"
              description="Set the role and level for this interview."
            />
            <div className="form-grid">
              <Field label="Job title">
                <Input
                  name="jobTitle"
                  defaultValue="Backend Developer"
                  required
                />
              </Field>
              <Field label="Experience level">
                <Select name="experienceLevel" defaultValue="Mid">
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                </Select>
              </Field>
            </div>
            <Field label="Candidate email" hint="Optional. The candidate must already have an account.">
              <Input
                name="candidateEmail"
                type="email"
                placeholder="candidate@example.com"
              />
            </Field>
          </Card>
          <Card>
            <SectionTitle
              title="Question source"
              description="Choose how you want AI to create relevant questions."
            />
            <div className="mode-tabs">
              {([
                ["technical", "Role & stack"],
                ["resume", "Candidate resume"],
                ["job", "Job description"],
                ["custom", "Custom only"],
              ] as [Mode, string][]).map(([value, label]) => (
                <button
                  type="button"
                  className={mode === value ? "active" : ""}
                  onClick={() => setMode(value)}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode === "technical" && (
              <div className="stack-fields">
                <Field
                  label="Tech stack"
                  hint="Separate technologies with commas."
                >
                  <Input
                    name="techStack"
                    defaultValue="Node.js, Express, PostgreSQL"
                  />
                </Field>
                <div className="form-grid">
                  <Field label="Difficulty">
                    <Select name="difficulty" defaultValue="Medium">
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </Select>
                  </Field>
                  <Field label="Question type">
                    <Select name="questionType" defaultValue="Mixed">
                      <option>Mixed</option>
                      <option>Theoretical</option>
                      <option>Coding</option>
                      <option>Design</option>
                    </Select>
                  </Field>
                </div>
              </div>
            )}
            {mode === "resume" && (
              <div className="stack-fields">
                <Field
                  label="Resume text"
                  hint="Paste plain text from the candidate’s resume."
                >
                  <Textarea
                    name="resume"
                    rows={8}
                    placeholder="Paste resume text here…"
                    required
                  />
                </Field>
                <Field label="Focus areas">
                  <Input
                    name="focusAreas"
                    defaultValue="projects, technical decisions"
                  />
                </Field>
              </div>
            )}
            {mode === "job" && (
              <div className="stack-fields">
                <Field label="Job description">
                  <Textarea
                    name="jobDescription"
                    rows={8}
                    placeholder="Paste the job description here…"
                    required
                  />
                </Field>
                <Field label="Question type">
                  <Select name="questionType" defaultValue="Mixed">
                    <option>Mixed</option>
                    <option>Theoretical</option>
                    <option>Coding</option>
                    <option>Design</option>
                  </Select>
                </Field>
              </div>
            )}
            {mode !== "custom" && (
              <div className="generate-row">
                <Field label="Number of questions">
                  <Select name="questionCount" defaultValue="3">
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                  </Select>
                </Field>
                <Button type="submit" loading={loading}>
                  <Sparkles size={17} /> Generate questions
                </Button>
              </div>
            )}
            {mode === "custom" && (
              <Button type="button" variant="secondary" onClick={addCustom}>
                <Plus size={17} /> Add custom question
              </Button>
            )}
            {error && (
              <ErrorState
                message={error}
                retry={() => lastForm?.requestSubmit()}
              />
            )}
          </Card>
        </form>
        <div className="question-review">
          <Card>
            <SectionTitle
              title="Interview questions"
              description={`${questions.length} questions added`}
              action={
                <Button variant="secondary" onClick={addCustom}>
                  <Plus size={16} /> Add
                </Button>
              }
            />
            {loading && <Skeleton rows={4} />}
            {!loading && questions.length === 0 && (
              <div className="review-empty">
                <Sparkles size={22} />
                <strong>No questions yet</strong>
                <p>Generate role-based questions or add your own.</p>
              </div>
            )}
            <div className="question-list">
              {questions.map((question, index) => (
                <div className="question-item" key={question.id || index}>
                  <GripVertical size={17} className="drag" />
                  <div className="grow">
                    <div className="question-meta">
                      <Badge tone="blue">
                        {question.type || "theoretical"}
                      </Badge>
                      <span>{question.topic}</span>
                    </div>
                    <Textarea
                      value={question.question_text}
                      rows={4}
                      onChange={(event) =>
                        setQuestions((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, question_text: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    {(question.based_on || question.maps_to_requirement) && (
                      <p className="trust-context">
                        <strong>Based on:</strong>{" "}
                        {question.based_on || question.maps_to_requirement}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    aria-label="Remove question"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          <div className="save-bar">
            <span>
              {questions.length ? "Ready to save" : "Add at least one question"}
            </span>
            <Button disabled={!questions.length} onClick={save}>
              Save interview
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
