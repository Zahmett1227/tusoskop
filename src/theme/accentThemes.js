export const accentThemes = {
  emerald: {
    name: "Emerald",
    primary: "bg-emerald-500",
    primaryHover: "hover:bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-400/40",
    ring: "ring-emerald-400/30",
    glow: "shadow-emerald-500/30",
    gradient: "from-emerald-400 to-teal-500",
    softBg: "bg-emerald-500/10",
    softBorder: "border-emerald-500/30",
  },
  cyan: {
    name: "Cyan",
    primary: "bg-cyan-500",
    primaryHover: "hover:bg-cyan-400",
    text: "text-cyan-400",
    border: "border-cyan-400/40",
    ring: "ring-cyan-400/30",
    glow: "shadow-cyan-500/30",
    gradient: "from-cyan-400 to-sky-500",
    softBg: "bg-cyan-500/10",
    softBorder: "border-cyan-500/30",
  },
  violet: {
    name: "Violet",
    primary: "bg-violet-500",
    primaryHover: "hover:bg-violet-400",
    text: "text-violet-400",
    border: "border-violet-400/40",
    ring: "ring-violet-400/30",
    glow: "shadow-violet-500/30",
    gradient: "from-violet-400 to-fuchsia-500",
    softBg: "bg-violet-500/10",
    softBorder: "border-violet-500/30",
  },
  amber: {
    name: "Amber",
    primary: "bg-amber-400",
    primaryHover: "hover:bg-amber-300",
    text: "text-amber-300",
    border: "border-amber-300/40",
    ring: "ring-amber-300/30",
    glow: "shadow-amber-400/30",
    gradient: "from-amber-300 to-orange-500",
    softBg: "bg-amber-400/10",
    softBorder: "border-amber-400/30",
  },
};

export function getRandomAccentTheme() {
  const keys = Object.keys(accentThemes);
  return keys[Math.floor(Math.random() * keys.length)];
}
