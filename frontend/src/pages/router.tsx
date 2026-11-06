import { lazy } from "react"
import { createBrowserRouter, Navigate } from "react-router"

import {
  CandidateLayout,
  DashboardLayout,
  PublicLayout,
} from "../components/layouts"

const HomePage = lazy(() => import("./Home"))

const LoginPage = lazy(() =>
  import("./Auth").then((module) => ({
    default: module.LoginPage,
  })),
)

const RegisterPage = lazy(() =>
  import("./Auth").then((module) => ({
    default: module.RegisterPage,
  })),
)

const RegistrationStatusPage = lazy(() =>
  import("./Auth").then((module) => ({
    default: module.RegistrationStatusPage,
  })),
)

const VerifyEmailPage = lazy(() =>
  import("./Auth").then((module) => ({
    default: module.VerifyEmailPage,
  })),
)

const DashboardPage = lazy(() => import("./Dashboard"))

const CreateInterviewPage = lazy(() =>
  import("./CreateInterview")
)

const CandidateDashboard = lazy(() =>
  import("./Candidate")
)

const InterviewSessionPage = lazy(() =>
  import("./InterviewSession")
)

const ResultsPage = lazy(() =>
  import("./Results")
)
const PracticePage = lazy(() => import("./Practice"))

export const router = createBrowserRouter([
  {
    Component: PublicLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      {
        path: "registration-status",
        Component: RegistrationStatusPage,
      },
      {
        path: "verify-email",
        Component: VerifyEmailPage,
      },
    ],
  },

  {
    Component: DashboardLayout,
    children: [
      { path: "dashboard", Component: DashboardPage },
      {
        path: "interviews/create",
        Component: CreateInterviewPage,
      },
      {
        path: "reports/:id?",
        Component: ResultsPage,
      },
    ],
  },

  {
    Component: CandidateLayout,
    children: [
      {
        path: "candidate",
        Component: CandidateDashboard,
      },
      {
        path: "candidate/results",
        Component: ResultsPage,
      },
      {
        path: "candidate/practice",
        Component: PracticePage,
      },
    ],
  },

  {
    path: "candidate/interview",
    Component: InterviewSessionPage,
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])