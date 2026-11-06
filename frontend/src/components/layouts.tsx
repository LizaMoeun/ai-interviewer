import { useState, type ReactNode } from "react"
import { NavLink, Outlet, useNavigate } from "react-router"
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "../app/auth"
import { Brand, Button } from "./ui"

const recruiterLinks = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/interviews/create", label: "Create interview", icon: Plus },
  { to: "/dashboard?view=candidates", label: "Candidates", icon: Users },
  { to: "/dashboard?view=reports", label: "Reports", icon: BarChart3 },
]

const adminLinks = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/dashboard?view=users", label: "User accounts", icon: Users },
  { to: "/dashboard?view=sessions", label: "Sessions", icon: ClipboardList },
  { to: "/dashboard?view=reports", label: "System reports", icon: BarChart3 },
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="public-nav">
        <div className="nav-inner">
          <Brand />
          <nav className={open ? "public-links open" : "public-links"}>
            <NavLink to="/login">Sign in</NavLink>
            <NavLink className="button button-primary" to="/register">
              Get started
            </NavLink>
          </nav>
          <Button
            className="menu-button"
            variant="ghost"
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>
      <Outlet />
    </>
  )
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const links = user?.role === "admin" ? adminLinks : recruiterLinks

  function signOut() {
    logout()
    navigate("/")
  }

  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <Brand />
          <Button
            variant="ghost"
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive && !to.includes("?") ? "active" : ""
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/dashboard?view=settings">
            <Settings size={18} />
            Settings
          </NavLink>
          <Button variant="ghost" onClick={signOut}>
            <LogOut size={18} />
            Sign out
          </Button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="shell-main">
        <AppHeader
          userName={user?.name || "User"}
          onMenu={() => setOpen(true)}
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function CandidateLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="candidate-shell">
      <header className="app-header candidate-header">
        <Brand />
        <nav className="candidate-nav">
          <NavLink to="/candidate">Interviews</NavLink>
          <NavLink to="/candidate/results">My results</NavLink>
          <NavLink to="/candidate/practice">Practice lab</NavLink>
        </nav>
        <div className="header-user">
          <div className="avatar">{(user?.name || "C").charAt(0)}</div>
          <div className="user-meta">
            <strong>{user?.name || "Candidate"}</strong>
            <span>Candidate</span>
          </div>
          <Button
            variant="ghost"
            aria-label="Sign out"
            onClick={() => {
              logout()
              navigate("/")
            }}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>
      <main className="candidate-main">
        <Outlet />
      </main>
    </div>
  )
}

function AppHeader({
  userName,
  onMenu,
}: {
  userName: string
  onMenu: () => void
}) {
  return (
    <header className="app-header">
      <Button
        variant="ghost"
        className="mobile-menu"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </Button>
      <div className="header-context">
        <BriefcaseBusiness size={18} />
        <span>InterviewAI workspace</span>
      </div>
      <div className="header-user">
        <div className="avatar">{userName.charAt(0)}</div>
        <div className="user-meta">
          <strong>{userName}</strong>
          <span>Workspace member</span>
        </div>
      </div>
    </header>
  )
}

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Brand />
        <div className="auth-message">
          <p className="eyebrow">Structured technical hiring</p>
          <h1>Make every interview more consistent.</h1>
          <p>
            Generate role-relevant questions, evaluate responses fairly, and
            give every candidate a thoughtful experience.
          </p>
        </div>
        <p className="auth-note">Trusted workflows for modern hiring teams</p>
      </div>
      <div className="auth-content">{children}</div>
    </main>
  )
}
