import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  Clock3,
  Scale,
  Sparkles,
} from "lucide-react"
import { Brand, Card, LinkButton } from "../components/ui"

const benefits = [
  {
    icon: Clock3,
    title: "Move faster",
    copy: "Generate structured technical interviews in minutes, not days.",
  },
  {
    icon: Scale,
    title: "Evaluate consistently",
    copy: "Give every candidate the same clear rubric and evidence-based review.",
  },
  {
    icon: BarChart3,
    title: "Decide with context",
    copy: "Turn answers and code into readable feedback your team can act on.",
  },
]

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-pill">
            <Sparkles size={15} />
            AI-assisted technical interviews
          </div>
          <h1>Technical hiring that is faster, fairer, and easier to trust.</h1>
          <p>
            InterviewAI helps teams create relevant interviews, evaluate every
            response consistently, and focus their time on the candidates who
            fit best.
          </p>
          <div className="hero-actions">
            <LinkButton to="/register">
              Start interviewing
              <ArrowRight size={17} />
            </LinkButton>
            <LinkButton to="/login" variant="secondary">
              Sign in
            </LinkButton>
          </div>
          <div className="trust-row">
            <span>
              <Check size={15} /> Structured questions
            </span>
            <span>
              <Check size={15} /> Consistent scoring
            </span>
            <span>
              <Check size={15} /> Candidate-friendly
            </span>
          </div>
        </div>
        <div className="hero-preview">
          <div className="preview-window">
            <div className="preview-top">
              <Brand compact />
              <span>Candidate report</span>
              <span className="window-dots">•••</span>
            </div>
            <div className="preview-body">
              <div className="preview-heading">
                <div>
                  <span className="hint">Backend Developer</span>
                  <h3>Alex Chen</h3>
                </div>
                <div className="preview-score">
                  <strong>86</strong>
                  <span>/100</span>
                </div>
              </div>
              <div className="preview-recommendation">
                <ClipboardCheck size={19} />
                <div>
                  <span className="hint">Recommendation</span>
                  <strong>Strong Hire</strong>
                </div>
              </div>
              <div className="preview-bars">
                {[
                  ["Technical depth", "88%"],
                  ["Problem solving", "84%"],
                  ["Communication", "82%"],
                ].map(([label, width]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <div>
                      <i style={{ width }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="preview-note">
                <strong>Standout strength</strong>
                <p>
                  Clear reasoning and strong understanding of API reliability
                  patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="center-heading">
          <p className="eyebrow">For candidates and curious learners</p>
          <h2>Practice on your own, whenever you want.</h2>
          <p>Generate a personalized question set, answer it like a quiz, get AI feedback, and run coding exercises without joining a live interview.</p>
        </div>
        <div className="benefit-grid">
          <Card><div className="feature-icon"><Sparkles size={21} /></div><h3>Generate questions</h3><p>Choose your role, technologies, level, and difficulty.</p></Card>
          <Card><div className="feature-icon"><ClipboardCheck size={21} /></div><h3>Practice as a quiz</h3><p>Work through questions one at a time and see feedback on your answers.</p></Card>
          <Card><div className="feature-icon"><BarChart3 size={21} /></div><h3>Run code safely</h3><p>Test coding answers in a sandbox before your real interview.</p></Card>
        </div>
      </section>

      <section className="content-section">
        <div className="center-heading">
          <p className="eyebrow">A more reliable process</p>
          <h2>
            Spend less time coordinating. Learn more from every interview.
          </h2>
        </div>
        <div className="benefit-grid">
          {benefits.map(({ icon: Icon, title, copy }) => (
            <Card key={title}>
              <div className="feature-icon">
                <Icon size={21} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div>
          <p className="eyebrow">Ready to improve your process?</p>
          <h2>Build your first structured interview today.</h2>
        </div>
        <LinkButton to="/register">
          Create an account
          <ArrowRight size={17} />
        </LinkButton>
      </section>

      <footer className="footer">
        <Brand />
        <p>Consistent technical interviews, powered by AI.</p>
        <span>© 2026 InterviewAI</span>
      </footer>
    </main>
  )
}
