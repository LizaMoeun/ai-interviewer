import { useState } from "react"
import { ArrowRight, Code2, Sparkles } from "lucide-react"
import { apiPost } from "../lib/api"
import { Badge, Button, Card, Field, Input, Select, Textarea } from "../components/ui"
import type { CodeEvaluation, Feedback, InterviewQuestion } from "../lib/storage"

export default function PracticePage() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [code, setCode] = useState("")
  const [feedback, setFeedback] = useState<Feedback | CodeEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const question = questions[current]

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    try {
      const result = await apiPost<{ questions: InterviewQuestion[] }>("/api/ai/questions", {
        jobTitle: data.get("jobTitle"),
        experienceLevel: data.get("experienceLevel"),
        techStack: String(data.get("techStack")).split(",").map((item) => item.trim()).filter(Boolean),
        difficulty: data.get("difficulty"),
        questionType: "Mixed",
        questionCount: Number(data.get("questionCount")),
      })
      setQuestions(result.questions)
      setCurrent(0)
      setFeedback(null)
      setAnswer("")
      setCode("")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate practice questions.")
    } finally {
      setLoading(false)
    }
  }

  async function evaluateAnswer() {
    if (!question || (!answer.trim() && question.type !== "coding")) return
    setLoading(true)
    setError("")
    try {
      if (question.type === "coding") {
        setFeedback(await apiPost<CodeEvaluation>("/api/submissions/execute", {
          candidateCode: code,
          testCases: [{ input: "", expectedOutput: "" }],
          programmingLanguage: "JavaScript",
          experienceLevel: "Mid",
          problemStatement: question.question_text,
        }))
      } else {
        setFeedback(await apiPost<Feedback>("/api/ai/feedback", {
          jobTitle: "Practice",
          experienceLevel: "Mid",
          question: question.question_text,
          idealAnswerCriteria: "A clear, accurate explanation with trade-offs and practical examples.",
          candidateAnswer: answer,
        }))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to evaluate your answer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header"><div><p className="eyebrow">Candidate practice lab</p><h1>Practice without an interview</h1><p className="page-description">Generate your own questions, answer them like a quiz, and run coding exercises whenever you want.</p></div></div>
      <Card><form className="create-form" onSubmit={generate}><div className="form-grid">
        <Field label="Role"><Input name="jobTitle" defaultValue="Backend Developer" required /></Field>
        <Field label="Experience level"><Select name="experienceLevel" defaultValue="Mid"><option>Junior</option><option>Mid</option><option>Senior</option></Select></Field>
        <Field label="Technology focus"><Input name="techStack" defaultValue="JavaScript, Node.js, databases" required /></Field>
        <Field label="Difficulty"><Select name="difficulty" defaultValue="Medium"><option>Easy</option><option>Medium</option><option>Hard</option></Select></Field>
        <Field label="Questions"><Input name="questionCount" type="number" min="1" max="10" defaultValue="5" required /></Field>
      </div><Button type="submit" loading={loading}><Sparkles size={16} /> Generate practice set</Button></form></Card>
      {error && <div className="form-error">{error}</div>}
      {question && <Card><div className="inline-actions"><Badge tone="blue">Question {current + 1} of {questions.length}</Badge><span className="muted">{question.topic} · {question.difficulty || "Mixed"}</span></div><h2>{question.question_text}</h2>
        {question.type === "coding" ? <Textarea value={code} onChange={(event) => setCode(event.target.value)} placeholder="// Write your JavaScript solution here" rows={12} /> : <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your answer, then request feedback..." rows={8} />}
        <div className="inline-actions"><Button onClick={evaluateAnswer} loading={loading}>{question.type === "coding" ? <Code2 size={16} /> : <Sparkles size={16} />} Check my answer</Button>{current < questions.length - 1 && <Button variant="secondary" onClick={() => { setCurrent((value) => value + 1); setFeedback(null); setAnswer(""); setCode("") }}>Next <ArrowRight size={16} /></Button>}</div>
        {feedback && <div className="feedback-card"><strong>{"score" in feedback ? `Score: ${feedback.score}/100` : "Code feedback"}</strong><p>{"feedback" in feedback ? feedback.feedback : feedback.code_feedback}</p></div>}
      </Card>}
    </>
  )
}