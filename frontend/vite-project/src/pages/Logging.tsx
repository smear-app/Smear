import { useState } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
// Chalk & Slate palette (dark) — matched from Home.tsx
const T = {
  bg: "#111210",
  surface: "#1A1C19",
  card: "#222521",
  border: "#2A2D29",
  text: "#F0EEE9",
  sub: "#888F85",
  accent: "#52B788",
  accentLight: "#95D5B2",
  green: "#52B788",
  gold: "#E76F1B",
  muted: "#2E332D",
};

// ─── SHARED SHELL ────────────────────────────────────────────────────────────
const Phone = ({ children, label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      cursor: onClick ? "pointer" : "default",
    }}
  >
    <div style={{
      width: 300, background: T.bg,
      borderRadius: 36, border: `6px solid ${active ? T.accent : "#1a1a1a"}`,
      boxShadow: active
        ? `0 0 0 2px ${T.accent}55, 0 20px 60px rgba(0,0,0,0.5)`
        : "0 12px 40px rgba(0,0,0,0.4)",
      overflow: "hidden", position: "relative",
      transition: "border-color 0.2s, box-shadow 0.2s",
      minHeight: 520,
      display: "flex", flexDirection: "column",
    }}>
      {/* Status bar */}
      <div style={{ height: 36, background: T.bg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", flexShrink: 0 }}>
        <span style={{ color: T.sub, fontSize: 10, fontWeight: 600 }}>9:41</span>
        <div style={{ width: 60, height: 16, background: "#111", borderRadius: 8 }} />
        <span style={{ color: T.sub, fontSize: 10 }}>●●●</span>
      </div>
      {children}
    </div>
    {label && (
      <div style={{ fontSize: 10, fontWeight: 700, color: active ? T.accentLight : T.sub, letterSpacing: 2, textTransform: "uppercase" }}>
        {label}
      </div>
    )}
  </div>
);

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
const Progress = ({ step, total, labels }) => (
  <div style={{ padding: "8px 20px 12px" }}>
    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: i === step ? 2 : 1, height: 3, borderRadius: 2,
          background: i <= step ? T.accent : T.muted,
          transition: "flex 0.3s ease, background 0.2s"
        }} />
      ))}
    </div>
    {labels && (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {labels.map((l, i) => (
          <div key={l} style={{ fontSize: 8, color: i === step ? T.accentLight : T.sub, fontWeight: i === step ? 700 : 400, letterSpacing: 0.5 }}>{l}</div>
        ))}
      </div>
    )}
  </div>
);

// ─── NAV HEADER ──────────────────────────────────────────────────────────────
const NavHeader = ({ title, step, total, onBack }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "4px 16px 0", gap: 8 }}>
    <button onClick={onBack} style={{ background: "none", border: "none", color: T.accentLight, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 0", minWidth: 40 }}>
      {step === 0 ? "✕" : "←"}
    </button>
    <div style={{ flex: 1, textAlign: "center", color: T.text, fontSize: 13, fontWeight: 800 }}>{title}</div>
    <div style={{ minWidth: 40, textAlign: "right", color: T.sub, fontSize: 10 }}>{step + 1}/{total}</div>
  </div>
);

// ─── CTA BUTTON ──────────────────────────────────────────────────────────────
const CTA = ({ label, onClick, secondary }) => (
  <div style={{ padding: "12px 20px 20px" }}>
    <button onClick={onClick} style={{
      width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
      background: secondary ? T.surface : `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
      color: secondary ? T.sub : "#fff",
      fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
      border: secondary ? `1px solid ${T.border}` : "none",
    }}>{label}</button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── STEP 1: PHOTO ───────────────────────────────────────────────────────────
const StepPhoto = ({ onNext, onBack }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <NavHeader title="Log Climb" step={0} total={4} onBack={onBack} />
    <Progress step={0} total={4} labels={["Photo", "Grade", "Send", "Tags"]} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 16 }}>
      <div style={{ color: T.sub, fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Add Route Photo</div>
      <div style={{
        width: "100%", aspectRatio: "3/4", maxHeight: 220,
        background: T.card, borderRadius: 20,
        border: `2px dashed ${T.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <div style={{ fontSize: 32 }}>📷</div>
        <div style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>Tap to add photo</div>
        <div style={{ color: T.sub, fontSize: 10 }}>Helps auto-tag hold types</div>
      </div>
      <button style={{ color: T.sub, fontSize: 11, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
        Skip — log without photo
      </button>
    </div>
    <CTA label="Continue →" onClick={onNext} />
  </div>
);

// ─── STEP 2: GRADE ───────────────────────────────────────────────────────────
const GRADES = ["VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];

const StepGrade = ({ onNext, onBack }) => {
  const [gymGrade, setGymGrade] = useState("V4");
  const [personalGrade, setPersonalGrade] = useState("V5");
  const [activeSlider, setActiveSlider] = useState("gym");

  const GradeRow = ({ label, value, setValue, isActive, onFocus }) => (
    <div
      onClick={onFocus}
      style={{
        background: isActive ? T.card : T.surface,
        borderRadius: 14, padding: "12px 14px",
        border: `1px solid ${isActive ? T.accent + "66" : T.border}`,
        cursor: "pointer", transition: "all 0.15s"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ color: isActive ? T.text : T.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
        <div style={{ color: T.accent, fontSize: 20, fontWeight: 900 }}>{value}</div>
      </div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
        {GRADES.map(g => (
          <button key={g} onClick={(e) => { e.stopPropagation(); setValue(g); }} style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700,
            background: g === value ? T.accent : T.muted,
            color: g === value ? "#fff" : T.sub,
          }}>{g}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <NavHeader title="Grade" step={1} total={4} onBack={onBack} />
      <Progress step={1} total={4} labels={["Photo", "Grade", "Send", "Tags"]} />
      <div style={{ flex: 1, padding: "8px 18px", display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
        <GradeRow label="Gym Grade" value={gymGrade} setValue={setGymGrade} isActive={activeSlider === "gym"} onFocus={() => setActiveSlider("gym")} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <div style={{ color: T.sub, fontSize: 9, letterSpacing: 1 }}>YOUR TAKE</div>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <GradeRow label="Felt Like" value={personalGrade} setValue={setPersonalGrade} isActive={activeSlider === "personal"} onFocus={() => setActiveSlider("personal")} />
        {gymGrade !== personalGrade && (
          <div style={{ background: T.card, borderRadius: 10, padding: "8px 12px", border: `1px solid ${T.border}`, textAlign: "center" }}>
            <span style={{ color: T.sub, fontSize: 10 }}>You rated this </span>
            <span style={{ color: personalGrade > gymGrade ? T.accentLight : T.green, fontSize: 10, fontWeight: 700 }}>
              {GRADES.indexOf(personalGrade) > GRADES.indexOf(gymGrade) ? "harder" : "easier"} than gym grade
            </span>
          </div>
        )}
      </div>
      <CTA label="Continue →" onClick={onNext} />
    </div>
  );
};

// ─── STEP 3: SEND TYPE ────────────────────────────────────────────────────────
const StepSend = ({ onNext, onBack }) => {
  const [sendType, setSendType] = useState(null);
  const options = [
    { type: "flash", emoji: "⚡", label: "Flash", sub: "Sent first try, no beta", color: T.gold },
    { type: "send", emoji: "✓", label: "Send", sub: "Completed after attempts", color: T.green },
    { type: "project", emoji: "◌", label: "Project", sub: "Still working on it, but haven't sent", color: T.sub },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <NavHeader title="How'd It Go?" step={2} total={4} onBack={onBack} />
      <Progress step={2} total={4} labels={["Photo", "Grade", "Send", "Tags"]} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 18px", gap: 10 }}>
        {options.map(({ type, emoji, label, sub, color }) => {
          const isSelected = sendType === type;
          return (
            <button key={type} onClick={() => setSendType(type)} style={{
              width: "100%", padding: "16px 18px", borderRadius: 16,
              border: `1.5px solid ${isSelected ? color : T.border}`,
              background: isSelected ? color + "18" : T.surface,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.15s", textAlign: "left",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: isSelected ? color + "30" : T.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>{emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: isSelected ? color : T.text, fontSize: 14, fontWeight: 800 }}>{label}</div>
                <div style={{ color: T.sub, fontSize: 10, marginTop: 2 }}>{sub}</div>
              </div>
              {isSelected && <div style={{ color: color, fontSize: 16 }}>●</div>}
            </button>
          );
        })}
      </div>
      <CTA label={sendType ? "Continue →" : "Select one to continue"} onClick={sendType ? onNext : undefined} />
    </div>
  );
};

// ─── STEP 4: TAGS ─────────────────────────────────────────────────────────────
const TAG_GROUPS = [
  { label: "Hold Type", tags: ["Crimp", "Sloper", "Pinch", "Pocket", "Jug"] },
  { label: "Movement", tags: ["Dynamic", "Static", "Balance", "Compression", "Tension"] },
  { label: "Wall Angle", tags: ["Slab", "Vertical", "Overhang", "Cave"] },
];

const StepTags = ({ onNext, onBack }) => {
  const [selected, setSelected] = useState(["Crimp", "Overhang"]);
  const toggle = (t) => setSelected(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <NavHeader title="Tag It" step={3} total={4} onBack={onBack} />
      <Progress step={3} total={4} labels={["Photo", "Grade", "Send", "Tags"]} />
      <div style={{ flex: 1, padding: "8px 18px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {TAG_GROUPS.map(({ label, tags }) => (
          <div key={label}>
            <div style={{ color: T.sub, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tags.map(t => {
                const on = selected.includes(t);
                return (
                  <button key={t} onClick={() => toggle(t)} style={{
                    padding: "7px 13px", borderRadius: 10,
                    border: `1px solid ${on ? T.accent : T.border}`,
                    background: on ? T.accent + "22" : T.surface,
                    color: on ? T.accentLight : T.sub,
                    fontSize: 11, fontWeight: on ? 700 : 500, cursor: "pointer",
                    transition: "all 0.12s",
                  }}>{t}</button>
                );
              })}
            </div>
          </div>
        ))}
        {selected.length > 0 && (
          <div style={{ background: T.card, borderRadius: 10, padding: "8px 12px", border: `1px solid ${T.border}` }}>
            <div style={{ color: T.sub, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Selected</div>
            <div style={{ color: T.accentLight, fontSize: 11, fontWeight: 700 }}>{selected.join(" · ")}</div>
          </div>
        )}
      </div>
      <CTA label="Save Climb ✓" onClick={onNext} />
    </div>
  );
};

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
const StepSuccess = ({ onReset }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", gap: 16 }}>
    <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.green + "22", border: `2px solid ${T.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>
    <div style={{ color: T.text, fontSize: 18, fontWeight: 900, textAlign: "center" }}>Climb Logged</div>
    <div style={{ background: T.card, borderRadius: 14, padding: "12px 16px", width: "100%", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: T.sub, fontSize: 10 }}>Grade</span>
        <span style={{ color: T.accent, fontSize: 13, fontWeight: 800 }}>V4</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: T.sub, fontSize: 10 }}>Send Type</span>
        <span style={{ color: T.green, fontSize: 10, fontWeight: 700 }}>✓ Send</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: T.sub, fontSize: 10 }}>Tags</span>
        <span style={{ color: T.text, fontSize: 10 }}>Crimp · Overhang</span>
      </div>
    </div>
    <div style={{ color: T.sub, fontSize: 10, textAlign: "center", lineHeight: 1.6 }}>
      Archetype updated · <span style={{ color: T.accentLight }}>Overhang V5 → V5+</span>
    </div>
    <button onClick={onReset} style={{ color: T.accentLight, fontSize: 12, fontWeight: 700, background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>← Back to feed</button>
  </div>
);

// ─── INTERACTIVE FLOW ────────────────────────────────────────────────────────
const InteractiveFlow = () => {
  const [step, setStep] = useState(0);
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));
  const reset = () => setStep(0);

  const screens = [
    <StepPhoto key="photo" onNext={next} onBack={back} />,
    <StepGrade key="grade" onNext={next} onBack={back} />,
    <StepSend key="send" onNext={next} onBack={back} />,
    <StepTags key="tags" onNext={next} onBack={back} />,
    <StepSuccess key="success" onReset={reset} />,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ color: T.sub, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Interactive — tap to walk through</div>
      <Phone active>
        {screens[step]}
      </Phone>
    </div>
  );
};

// ─── STATIC OVERVIEW (all steps side by side) ────────────────────────────────
const StaticOverview = () => {
  const steps = [
    { label: "01 · Photo", content: <StepPhoto onNext={() => {}} onBack={() => {}} /> },
    { label: "02 · Grade", content: <StepGrade onNext={() => {}} onBack={() => {}} /> },
    { label: "03 · Send Type", content: <StepSend onNext={() => {}} onBack={() => {}} /> },
    { label: "04 · Tags", content: <StepTags onNext={() => {}} onBack={() => {}} /> },
  ];

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
      {steps.map(({ label, content }) => (
        <Phone key={label} label={label}>
          {content}
        </Phone>
      ))}
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("both");

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0F0C",
      padding: "32px 20px 48px",
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ color: T.sub, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Smear</div>
        <div style={{ color: T.text, fontSize: 20, fontWeight: 900, letterSpacing: -0.5, marginBottom: 16 }}>Logging Flow Wireframes</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[["both", "All Steps"], ["interactive", "Interactive"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
              background: view === id ? T.accent : T.surface,
              color: view === id ? "#fff" : T.sub,
              border: `1px solid ${view === id ? T.accent : T.border}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {view === "both" && <StaticOverview />}
      {view === "interactive" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <InteractiveFlow />
        </div>
      )}

      {/* Notes */}
      <div style={{ maxWidth: 680, margin: "32px auto 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Photo Step", note: "Optional — skip link keeps flow fast. Could auto-trigger camera on mobile." },
          { label: "Grade Step", note: "Gym grade vs personal grade side by side. Diff indicator builds archetype trust." },
          { label: "Send Type", note: "Large tap targets, single choice. Flash/Send/Attempt maps to archetype weighting." },
          { label: "Tags Step", note: "Grouped by Hold / Movement / Angle. Multi-select, pre-select from AI analysis later." },
        ].map(({ label, note }) => (
          <div key={label} style={{ background: T.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${T.border}` }}>
            <div style={{ color: T.accentLight, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <div style={{ color: T.sub, fontSize: 11, lineHeight: 1.6 }}>{note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}