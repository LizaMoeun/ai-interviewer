export type SavedInterview = {
  id: string
  candidateName?: string | null
  recruiterId?: string
  candidateId?: string | null
  title: string
  role: string
  status: "Not started" | "In progress" | "Completed"
  due: string
  questions: InterviewQuestion[]
  session?: SessionState
  report?: unknown
}

export type InterviewQuestion = {
  id: string
  type: "theoretical" | "coding" | "design"
  topic: string
  difficulty?: string
  question_text: string
  estimated_time?: string
  based_on?: string
  maps_to_requirement?: string
}

export type SessionState = {
  current: number
  answers: Record<string, string>
  feedback: Record<string, Feedback>
  codeEvaluations: Record<string, CodeEvaluation>
  followUps: Record<string, string>
  followUpAnswers: Record<string, string>
  followUpFeedback: Record<string, Feedback>
  completed: boolean
}

export type Feedback = {
  score: number
  strengths: string | string[]
  weaknesses: string | string[]
  feedback: string
  missed_key_points: string[]
}

export type CodeEvaluation = {
  score: number
  correctness: "pass" | "partial" | "fail"
  time_complexity_estimate: string
  space_complexity_estimate: string
  strengths: string | string[]
  weaknesses: string | string[]
  edge_cases_missed: string[]
  code_feedback: string
}

export function getSession(): SessionState {
  return {
    current: 0,
    answers: {},
    feedback: {},
    codeEvaluations: {},
    followUps: {},
    followUpAnswers: {},
    followUpFeedback: {},
    completed: false,
  }
}

export async function fetchInterviews(): Promise<SavedInterview[]> {
  return apiRequest<SavedInterview[]>("/api/interviews")
}

export async function createInterview(
  interview: Omit<SavedInterview, "id" | "status"> & {
    id?: string
    candidateEmail?: string
  },
) {
  return apiRequest<SavedInterview>("/api/interviews", {
    method: "POST",
    body: JSON.stringify(interview),
  })
}

export async function fetchInterview(id: string) {
  return apiRequest<SavedInterview>(`/api/interviews/${id}`)
}

export async function persistSession(id: string, session: SessionState) {
  return apiRequest<{ session: SessionState; status: SavedInterview["status"] }>(
    `/api/interviews/${id}/session`,
    { method: "PATCH", body: JSON.stringify(session) },
  )
}

export async function persistReport(id: string, report: unknown) {
  return apiRequest(`/api/interviews/${id}/report`, {
    method: "PUT",
    body: JSON.stringify(report),
  })
}
import { apiRequest } from "./api"
