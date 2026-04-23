import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/landing.css"

type RevealDirection = "up" | "left" | "right"

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: RevealDirection
}

function Reveal({ children, className = "", delay = 0, direction = "up" }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        setVisible(true)
        observer.disconnect()
      },
      { threshold: 0.14 },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`landing-reveal landing-reveal--${direction} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  )
}

function useScrolledState(threshold = 32) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])

  return scrolled
}

function HeroRiveSlot() {
  return (
    <div className="landing-rive-slot landing-rive-slot--hero" data-rive-slot="hero_arc">
      <div className="landing-rive-grid" aria-hidden="true" />
      <svg viewBox="0 0 600 360" className="landing-hero-graph" aria-label="Climbing progression visualization">
        <defs>
          <linearGradient id="landing-hero-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--landing-accent)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--landing-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="landing-hero-graph__fill"
          d="M 54 290 C 116 256, 156 224, 208 194 C 252 170, 286 176, 330 154 C 372 134, 404 94, 456 72 C 498 56, 532 52, 560 44 L 560 320 L 54 320 Z"
        />
        <path
          className="landing-hero-graph__line"
          d="M 54 290 C 116 256, 156 224, 208 194 C 252 170, 286 176, 330 154 C 372 134, 404 94, 456 72 C 498 56, 532 52, 560 44"
        />
        <g className="landing-hero-graph__labels">
          {[
            ["V2", 288],
            ["V4", 224],
            ["V5", 176],
            ["V6", 112],
            ["V7", 58],
          ].map(([label, y]) => (
            <text key={label} x="14" y={y} dominantBaseline="middle">
              {label}
            </text>
          ))}
        </g>
      </svg>
      <div className="landing-rive-slot__badge">future rive: hero_arc.riv</div>
    </div>
  )
}

function ArchetypeRiveSlot() {
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        setActive(true)
        observer.disconnect()
      },
      { threshold: 0.24 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const dimensions = ["Slab", "Overhang", "Crimp", "Compression", "Endurance"]
  const userValues = [0.82, 0.44, 0.74, 0.37, 0.68]
  const averageValues = [0.53, 0.51, 0.55, 0.5, 0.52]
  const rings = [0.25, 0.5, 0.75, 1]

  const centerX = 170
  const centerY = 140
  const radius = 95
  const angleOf = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / dimensions.length
  const pointOf = (value: number, index: number) => ({
    x: centerX + radius * value * Math.cos(angleOf(index)),
    y: centerY + radius * value * Math.sin(angleOf(index)),
  })
  const polygon = (values: number[]) =>
    values
      .map((value, index) => {
        const point = pointOf(value, index)
        return `${point.x.toFixed(2)},${point.y.toFixed(2)}`
      })
      .join(" ")

  return (
    <div
      ref={ref}
      className={`landing-rive-slot landing-rive-slot--analytics ${active ? "is-active" : ""}`}
      data-rive-slot="archetype"
    >
      <svg viewBox="0 0 340 280" className="landing-radar-chart" aria-label="Climber archetype radar chart">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={polygon(dimensions.map(() => ring))}
            className="landing-radar-chart__ring"
          />
        ))}
        {dimensions.map((dimension, index) => {
          const outer = pointOf(1, index)
          const label = pointOf(1.28, index)
          const labelShift = index === 2 ? 6 : index === 3 ? -6 : 0
          return (
            <g key={dimension}>
              <line
                x1={centerX}
                y1={centerY}
                x2={outer.x}
                y2={outer.y}
                className="landing-radar-chart__axis"
              />
              <text
                x={label.x + labelShift}
                y={label.y + 4}
                textAnchor="middle"
                className="landing-radar-chart__label"
              >
                {dimension}
              </text>
            </g>
          )
        })}
        <polygon points={polygon(averageValues)} className="landing-radar-chart__average" />
        <polygon points={polygon(userValues)} className="landing-radar-chart__user" />
        {userValues.map((value, index) => {
          const point = pointOf(value, index)
          return (
            <circle
              key={dimensions[index]}
              cx={point.x}
              cy={point.y}
              r={value < 0.5 ? 4.5 : 3.5}
              className="landing-radar-chart__dot"
              style={{ transitionDelay: `${0.64 + index * 0.1}s` }}
            />
          )
        })}
      </svg>
      <div className="landing-radar-chart__legend">
        <span><i className="landing-radar-chart__legend-line landing-radar-chart__legend-line--solid" />your profile</span>
        <span><i className="landing-radar-chart__legend-line landing-radar-chart__legend-line--dashed" />gym average</span>
      </div>
      <div className="landing-rive-slot__badge">future rive: archetype.riv</div>
    </div>
  )
}

function LoadingRiveSlot() {
  return (
    <div className="landing-loading-slot" data-rive-slot="loading">
      <div className="landing-loading-slot__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="landing-loading-slot__label">Building your archetype...</div>
      <div className="landing-rive-slot__badge">future rive: loading.riv</div>
    </div>
  )
}

function LandingNav() {
  const { session } = useAuth()
  const scrolled = useScrolledState()

  return (
    <header className={`landing-nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="landing-shell landing-nav__inner">
        <Link to="/" className="landing-wordmark">
          Smear
        </Link>
        <nav className="landing-nav__links" aria-label="Landing page">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#access">Early access</a>
          <Link to={session ? "/home" : "/auth"} className="landing-button landing-button--solid landing-button--compact">
            {session ? "Open app" : "Log in"}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-shell landing-hero__grid">
        <div className="landing-hero__lead-in">
          <Reveal direction="left">
            <div className="landing-eyebrow">Indoor climbing progression</div>
          </Reveal>
          <Reveal direction="left" delay={120} className="landing-hero__signal">
            <span>5 dimensions</span>
            <i aria-hidden="true" />
            <span>1 readable shape</span>
          </Reveal>
        </div>

        <div className="landing-hero__top-row">
          <div className="landing-hero__copy-column">
            <div className="landing-hero__title-wrap">
              <h1 className="landing-hero__title">
                <span>Know the climber</span>
              <span className="is-muted">you&apos;re becoming.</span>
              </h1>
            </div>
            <Reveal direction="left" delay={220}>
              <p className="landing-hero__copy">
                Climbers usually feel progress before they can explain it. Smear turns that blur into a readable
                shape, broken down by style and grounded in what actually happened on the wall.
              </p>
            </Reveal>
          </div>

          <div className="landing-hero__visual-column">
            <Reveal direction="right" delay={180} className="landing-hero__visual-frame">
              <HeroRiveSlot />
            </Reveal>
          </div>
        </div>

        <div className="landing-hero__supporting-row">
          <Reveal direction="left" delay={340} className="landing-hero__actions">
            <a href="#access" className="landing-button landing-button--solid">
              Request early access
            </a>
            <a href="#how-it-works" className="landing-button landing-button--ghost">
              See how it works
            </a>
          </Reveal>

          <Reveal direction="left" delay={460} className="landing-hero__loading">
            <LoadingRiveSlot />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const problems = [
    {
      num: "01",
      title: "Your max grade is a proxy.",
      body: "One number tries to cover slab, overhang, crimp, compression, and endurance. It hides more than it shows.",
    },
    {
      num: "02",
      title: "Intuition drifts.",
      body: "You can feel a good month in the gym. Without structure, the feeling and the facts never really meet.",
    },
    {
      num: "03",
      title: "Sessions vanish.",
      body: "Notes, videos, and route names pile up. The record exists, but the meaning rarely survives the week.",
    },
  ]

  return (
    <section className="landing-section landing-section--ruled">
      <div className="landing-shell">
        <Reveal direction="left">
          <div className="landing-eyebrow">The problem</div>
          <br></br>
        </Reveal>
        <div className="landing-problem-grid">
          {problems.map((problem, index) => (
            <Reveal key={problem.num} delay={index * 120} className="landing-problem-card">
              <span>{problem.num}</span>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={380} className="landing-quote">
          <p>
            “Most climbers improve. Few can say precisely where, in what style, and why it happened when it did.”
          </p>
          <footer>The Smear Method</footer>
        </Reveal>
      </div>
    </section>
  )
}

function SolutionSection() {
  return (
    <section className="landing-section landing-section--dark">
      <div className="landing-shell landing-solution-grid">
        <div className="landing-solution-copy">
          <Reveal direction="left">
            <div className="landing-eyebrow">The solution</div>
          </Reveal>
          <Reveal direction="left" delay={100}>
            <h2 className="landing-section-title landing-section-title--light">
              You are not
              <span>one grade.</span>
            </h2>
          </Reveal>
          <Reveal direction="left" delay={220}>
            <p className="landing-dark-copy">
              Smear models you as a style-specific athlete. Slab, overhang, crimp, compression. Each dimension moves
              on its own timeline, and each one tells a different story.
            </p>
          </Reveal>
          <Reveal direction="left" delay={320}>
            <p className="landing-dark-copy is-secondary">
              The point is not your hardest send. It is whether you are improving in ways that are actually true.
            </p>
          </Reveal>
          <div className="landing-stat-grid">
            <Reveal delay={420} className="landing-stat-card">
              <div>
                <strong>5</strong>
                <span>style dimensions tracked independently per climber</span>
              </div>
            </Reveal>
            <Reveal delay={500} className="landing-stat-card">
              <div>
                <strong>1 number</strong>
                <span>is never the full picture of a climber&apos;s ability</span>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal direction="right" delay={180} className="landing-analytics-panel">
          <div className="landing-analytics-panel__meta">
            <div>
              <span className="landing-eyebrow">Climbing archetype</span>
              <p>Style profile</p>
            </div>
            <span>5 dimensions</span>
          </div>
          <div className="landing-analytics-panel__chart">
            <ArchetypeRiveSlot />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      number: "01",
      title: "Style fingerprint",
      body: "Your ability broken into slab, overhang, crimp, compression, and endurance so the real gap is visible.",
      tag: "Archetype",
    },
    {
      number: "02",
      title: "Session capture",
      body: "Log climbs with enough structure that the data becomes useful later instead of turning into an archive of half-memories.",
      tag: "Data",
    },
    {
      number: "03",
      title: "Canonical routes",
      body: "Shared climbs create context. Your progress gets measured against the route itself, not against memory drift.",
      tag: "Context",
    },
    {
      number: "04",
      title: "Progress reflection",
      body: "Your history comes back as something readable, situated, and more honest than the hardest send you can remember.",
      tag: "Insight",
    },
  ]

  return (
    <section id="features" className="landing-section landing-section--ruled">
      <div className="landing-shell">
        <div className="landing-section-heading-grid">
          <div>
            <Reveal direction="left">
              <div className="landing-eyebrow">Features</div>
              <h2 className="landing-section-title">
                Structure over
                <span>feeling.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal direction="right" delay={140}>
            <p className="landing-section-lead">
              Smear is not a training diary. It uses structured session data to build a model of the climber you are,
              and the climber you are becoming.
            </p>
          </Reveal>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature, index) => (
            <Reveal key={feature.number} delay={index * 90} className="landing-feature-card">
              <div className="landing-feature-card__meta">
                <span>{feature.number}</span>
                <span>{feature.tag}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <i />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Log the climb",
      body: "Grade, style, hold type, outcome. Enough structure that the data actually means something later.",
    },
    {
      num: "02",
      title: "Smear builds your archetype",
      body: "Patterns across sessions show which dimensions are moving, which are stalled, and where the next gap is forming.",
    },
    {
      num: "03",
      title: "Train toward the gap",
      body: "Your next session is informed by every previous one, so effort has direction instead of just volume.",
    },
  ]

  return (
    <section id="how-it-works" className="landing-section landing-section--ruled">
      <div className="landing-shell">
        <Reveal direction="left">
          <div className="landing-eyebrow">How it works</div>
        </Reveal>
        <div><br></br></div>
        <div className="landing-step-grid">
          <div className="landing-step-grid__line" aria-hidden="true" />
          {steps.map((step, index) => (
            <Reveal key={step.num} delay={index * 130} className="landing-step-card">
              <div className="landing-step-card__count">
                <span>{step.num}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function AccessSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const { session } = useAuth()
  const accessInbox = "smear.app@gmail.com"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.includes("@")) {
      setError("Enter a valid email.")
      return
    }

    const subject = encodeURIComponent("Smear access request")
    const body = encodeURIComponent(`Please add this email to the Smear access list:\n\n${email.trim()}`)

    window.location.href = `mailto:${accessInbox}?subject=${subject}&body=${body}`
    setSubmitted(true)
    setError("")
  }

  return (
    <section id="access" className="landing-section landing-section--soft">
      <div className="landing-shell landing-access">
        <Reveal>
          <div className="landing-eyebrow">Early access</div>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="landing-section-title landing-section-title--centered">
            Improvement
            <span>made legible.</span>
          </h2>
        </Reveal>
        <div><br></br></div>
        <Reveal delay={200}>
          <p className="landing-section-lead landing-section-lead--centered">
            Smear is for indoor climbers who want a sharper picture of progress than a single grade can offer.
          </p>
          <br></br>
        </Reveal>

        {!submitted ? (
          <Reveal delay={320}>
            <form onSubmit={handleSubmit} className="landing-access__form">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                className="landing-access__input"
              />
              <button type="submit" className="landing-button landing-button--solid">
                Request access
              </button>
            </form>
            {error ? <p className="landing-access__error">{error}</p> : null}
            <p className="landing-access__note">No noise. No weekly drip. Just a reply when access is ready.</p>
            {!session ? (
              <Link to="/auth" className="landing-access__secondary">
                Already invited? Log in.
              </Link>
            ) : null}
          </Reveal>
        ) : (
          <Reveal>
            <div className="landing-access__success">
              <i />
              <span>You are on the list.</span>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-shell landing-footer__inner">
        <span className="landing-wordmark">Smear</span>
        <span>contact → friction → reveal → clarity</span>
        <span>2026</span>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add("landing-body")
    return () => {
      document.body.classList.remove("landing-body")
    }
  }, [])

  const glowStyle = {
    "--landing-glow-x": "82%",
    "--landing-glow-y": "18%",
  } as CSSProperties

  return (
    <div className="landing-page" style={glowStyle}>
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AccessSection />
      </main>
      <LandingFooter />
    </div>
  )
}
