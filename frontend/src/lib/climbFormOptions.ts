export const GRADE_OPTIONS = [
  "VB",
  "V0",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V7",
  "V8",
  "V9",
  "V10",
  "V10+",
] as const

export const SEND_OPTIONS = ["Flash", "Send", "Attempt"] as const

export const TAG_SECTIONS = [
  {
    title: "Hold type",
    options: ["Crimp", "Sloper", "Pinch", "Pocket", "Jug"],
  },
  {
    title: "Movement",
    options: ["Dynamic", "Static", "Balance", "Compression", "Tension"],
  },
  {
    title: "Wall angle",
    options: ["Slab", "Vertical", "Overhang", "Cave"],
  },
] as const
