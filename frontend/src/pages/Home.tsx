import { useState } from "react";

const PALETTES = [
  {
    id: "chalk",
    name: "Chalk & Slate",
    description: "Clean, athletic, modern. Feels like a well-lit bouldering gym.",
    light: {
      bg: "#F7F6F4", surface: "#EDECEA", card: "#FFFFFF",
      text: "#1C1C1E", textSub: "#6B6B70", border: "#E0DED9",
      accent: "#2D6A4F", accentSub: "#52B788", accentText: "#FFFFFF",
      flash: "#E76F1B", send: "#2D6A4F", attempt: "#9A9A9E"
    },
    dark: {
      bg: "#111210", surface: "#1A1C19", card: "#222521",
      text: "#F0EEE9", textSub: "#888F85", border: "#2A2D29",
      accent: "#52B788", accentSub: "#2D6A4F", accentText: "#0D1F17",
      flash: "#E76F1B", send: "#52B788", attempt: "#555"
    }
  },
  {
    id: "stone",
    name: "Stone & Ember",
    description: "Warm neutrals with a burnt accent. Feels like outdoor climbing culture.",
    light: {
      bg: "#F5F2EE", surface: "#EDE8E2", card: "#FFFFFF",
      text: "#1E1A16", textSub: "#7A6F65", border: "#DDD8D0",
      accent: "#C1440E", accentSub: "#E8835A", accentText: "#FFFFFF",
      flash: "#C1440E", send: "#5A7A4A", attempt: "#9A9590"
    },
    dark: {
      bg: "#131110", surface: "#1E1A17", card: "#252119",
      text: "#F2EDE7", textSub: "#8A8078", border: "#2E2925",
      accent: "#E8835A", accentSub: "#C1440E", accentText: "#1E0E08",
      flash: "#E8835A", send: "#7AAA65", attempt: "#555"
    }
  },
  {
    id: "nordic",
    name: "Nordic Ice",
    description: "Cool and minimal. Tech-forward, less 'extreme', more precision.",
    light: {
      bg: "#F4F6F8", surface: "#E8EDF2", card: "#FFFFFF",
      text: "#1A1E24", textSub: "#5A6472", border: "#D8DFE8",
      accent: "#2B5CE6", accentSub: "#7BA7F7", accentText: "#FFFFFF",
      flash: "#E67E22", send: "#27AE60", attempt: "#8A9BAC"
    },
    dark: {
      bg: "#0E1117", surface: "#151B24", card: "#1C2430",
      text: "#E8ECF2", textSub: "#6A7D90", border: "#1F2A38",
      accent: "#4A80F5", accentSub: "#2B5CE6", accentText: "#0A1030",
      flash: "#E67E22", send: "#27AE60", attempt: "#445566"
    }
  },
  {
    id: "dusk",
    name: "Dusk",
    description: "Soft purple-grey. Calm and distinct — nothing else in fitness looks like this.",
    light: {
      bg: "#F3F2F7", surface: "#E9E8F0", card: "#FFFFFF",
      text: "#1E1B2E", textSub: "#6B6880", border: "#DDDBE8",
      accent: "#7C5CBF", accentSub: "#B39DDB", accentText: "#FFFFFF",
      flash: "#D4930A", send: "#3D8C5E", attempt: "#9A98A8"
    },
    dark: {
      bg: "#0F0E17", surface: "#161425", card: "#1E1B2E",
      text: "#EAE8F2", textSub: "#7A7890", border: "#252238",
      accent: "#9B79D4", accentSub: "#7C5CBF", accentText: "#0A0818",
      flash: "#D4930A", send: "#4DAA78", attempt: "#444"
    }
  }
];

const FlameIcon = () => <span style={{ fontSize: 11 }}>⚡</span>;

const MiniCard = ({ climb, theme }) => (
  <div style={{
    background: theme.card, borderRadius: 12, padding: "10px 12px",
    border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 10,
    marginBottom: 6
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: theme.surface,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      <div style={{ color: theme.accent, fontSize: 13, fontWeight: 900 }}>{climb.grade}</div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: theme.text, fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{climb.name}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {climb.tags.map(t => (
          <span key={t} style={{
            fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
            background: theme.surface, color: theme.textSub
          }}>{t}</span>
        ))}
      </div>
    </div>
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
      background: climb.sendType === "flash" ? theme.flash + "22" : climb.sendType === "send" ? theme.send + "22" : theme.attempt + "22",
      color: climb.sendType === "flash" ? theme.flash : climb.sendType === "send" ? theme.send : theme.attempt,
      textTransform: "capitalize"
    }}>{climb.sendType}</span>
  </div>
);

const PhonePreview = ({ palette, isDark }) => {
  const theme = isDark ? palette.dark : palette.light;
  const climbs = [
    { grade: "V5", name: "Blue Compression", tags: ["Crimp", "OHang"], sendType: "flash" },
    { grade: "V3", name: "Green Slab", tags: ["Slab", "Balance"], sendType: "send" },
    { grade: "V6", name: "Red Dyno", tags: ["Dynamic"], sendType: "attempt" },
  ];

  return (
    <div style={{
      width: "100%", background: theme.bg, borderRadius: 20,
      padding: "16px 14px", border: `1.5px solid ${theme.border}`,
      fontFamily: "'SF Pro Display', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ color: theme.textSub, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Welcome back</div>
          <div style={{ color: theme.text, fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>Jaden</div>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: theme.accent, display: "flex", alignItems: "center",
          justifyContent: "center", color: theme.accentText, fontWeight: 800, fontSize: 12
        }}>J</div>
      </div>

      {/* Archetype strip */}
      <div style={{ background: theme.surface, borderRadius: 12, padding: "8px 10px", marginBottom: 14, border: `1px solid ${theme.border}` }}>
        <div style={{ color: theme.textSub, fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Archetype</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["Crimp", "V5"], ["Slab", "V2"], ["Dyn", "V4"], ["OHang", "V6"]].map(([label, grade]) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: theme.accent, fontSize: 11, fontWeight: 800 }}>{grade}</div>
              <div style={{ color: theme.textSub, fontSize: 8 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Climbs */}
      <div style={{ color: theme.textSub, fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Recent Climbs</div>
      {climbs.map(c => <MiniCard key={c.name} climb={c} theme={theme} />)}

      {/* FAB */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: theme.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: theme.accentText, fontSize: 20, fontWeight: 300, lineHeight: 1
        }}>+</div>
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark ? "#0A0A0C" : "#F0EEF8",
      padding: "32px 20px",
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      transition: "background 0.3s ease"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ color: isDark ? "#666" : "#999", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Smear — Color Exploration</div>
        <div style={{ color: isDark ? "#fff" : "#1a1a1a", fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Pick a palette direction</div>

        {/* Dark mode toggle */}
        <button onClick={() => setIsDark(d => !d)} style={{
          padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
          background: isDark ? "#222" : "#1a1a1a", color: "#fff", fontSize: 12, fontWeight: 600
        }}>
          {isDark ? "☀ Light Mode" : "☾ Dark Mode"}
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, maxWidth: 1080, margin: "0 auto" }}>
        {PALETTES.map(palette => {
          const theme = isDark ? palette.dark : palette.light;
          const isSelected = selected === palette.id;
          return (
            <div
              key={palette.id}
              onClick={() => setSelected(isSelected ? null : palette.id)}
              style={{
                borderRadius: 20, overflow: "hidden", cursor: "pointer",
                border: `2px solid ${isSelected ? theme.accent : "transparent"}`,
                boxShadow: isSelected ? `0 0 0 4px ${theme.accent}33` : "0 4px 20px rgba(0,0,0,0.12)",
                transition: "all 0.2s ease",
                background: isDark ? "#111" : "#fff"
              }}
            >
              {/* Label */}
              <div style={{ padding: "14px 16px 10px", background: isDark ? "#161616" : "#fafafa", borderBottom: `1px solid ${isDark ? "#1e1e1e" : "#eee"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: isDark ? "#fff" : "#1a1a1a", fontSize: 14, fontWeight: 800 }}>{palette.name}</div>
                    <div style={{ color: isDark ? "#666" : "#999", fontSize: 10, marginTop: 2, lineHeight: 1.5 }}>{palette.description}</div>
                  </div>
                  {isSelected && <div style={{ color: theme.accent, fontSize: 16 }}>✓</div>}
                </div>
                {/* Swatch row */}
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  {[theme.bg, theme.surface, theme.card, theme.accent, theme.flash, theme.send].map((c, i) => (
                    <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: `1px solid ${isDark ? "#333" : "#ddd"}` }} />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div style={{ padding: "12px" }}>
                <PhonePreview palette={palette} isDark={isDark} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected summary */}
      {selected && (() => {
        const p = PALETTES.find(x => x.id === selected);
        const theme = isDark ? p.dark : p.light;
        return (
          <div style={{
            maxWidth: 500, margin: "28px auto 0",
            background: isDark ? "#111" : "#fff",
            borderRadius: 16, padding: "16px 20px",
            border: `1px solid ${theme.accent}44`,
            textAlign: "center"
          }}>
            <div style={{ color: theme.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Selected: {p.name}</div>
            <div style={{ color: isDark ? "#aaa" : "#555", fontSize: 12, lineHeight: 1.7 }}>
              This palette uses <strong style={{ color: isDark ? "#ddd" : "#222" }}>{isDark ? p.dark.accent : p.light.accent}</strong> as its accent across both modes. The send/flash/attempt states have distinct colors that work without feeling neon.
            </div>
          </div>
        );
      })()}
    </div>
  );
}