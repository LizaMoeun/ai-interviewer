import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { apiPost, getApiToken, setApiToken } from "../lib/api"

export type Role = "candidate" | "recruiter" | "admin"
export type User = { id: string; name: string; email: string; role: Role }
export type Registration = User & {
  status: "Pending email verification" | "Pending admin approval" | "Active" | "Rejected"
}

export function getRegistrations(): Registration[] {
  return []
}

export function approveRecruiter(_email: string) {}

export function rejectRecruiter(_email: string) {}

type AuthValue = {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  register: (
    name: string,
    email: string,
    password: string,
    role: Exclude<Role, "admin">,
  ) => Promise<Registration>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!getApiToken())

  useEffect(() => {
    const token = getApiToken()
    if (!token) return
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")
    fetch(`${apiBase}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.success) throw new Error(payload.error)
        setUser(payload.data)
      })
      .catch(() => {
        setApiToken(null)
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      async login(email, password) {
        const result = await apiPost<{ token: string; user: User }>("/api/auth/login", {
          email,
          password,
        })
        setApiToken(result.token)
        setUser(result.user)
        return result.user
      },
      async register(name, email, password, role) {
        const result = await apiPost<{ token?: string; user: User; status: Registration["status"] }>(
          "/api/auth/register",
          { name, email, password, role },
        )
        if (result.token) {
          setApiToken(result.token)
          setUser(result.user)
        }
        return { ...result.user, status: result.status }
      },
      logout() {
        setApiToken(null)
        setUser(null)
      },
    }),
    [ready, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
