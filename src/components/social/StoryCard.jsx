import React, { useMemo } from "react";
import { getTopicTheme, themeToPalette } from "../../social/design/topicThemes.js";

function hexToRgb(hex) {
  const h = (hex || "#10b981").replace("#", "");
  return `${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}`;
}

function questionFontSize(text) {
  const len = (text || "").length;
  if (len < 80) return 36;
  if (len < 130) return 32;
  if (len < 190) return 27;
  if (len < 260) return 24;
  return 21;
}

function optionFontSize(options) {
  const maxLen = Math.max(0, ...(options || []).map((o) => (o.text || String(o || "")).length));
  if (maxLen < 35) return 22;
  if (maxLen < 55) return 19;
  return 17;
}

function AnatomyDecor({ themeId, color: c }) {
  if (themeId === "cardiology" || themeId === "internal_medicine") {
    return (
      <svg width="300" height="280" viewBox="0 0 300 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M150 235 C115 195 55 168 55 112 C55 72 86 44 117 50 C133 53 148 66 150 66 C152 66 167 53 183 50 C214 44 245 72 245 112 C245 168 185 195 150 235Z"
          stroke={c} strokeWidth="2.5" strokeLinejoin="round"
        />
        <path
          d="M72 182 H104 L115 158 L128 196 L139 170 H228"
          stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (themeId === "microbiology" || themeId === "infectious") {
    const spikes = [0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => {
      const r = (Math.PI * ang) / 180;
      return (
        <line
          key={i}
          x1={140 + 54 * Math.cos(r)} y1={140 + 54 * Math.sin(r)}
          x2={140 + 76 * Math.cos(r)} y2={140 + 76 * Math.sin(r)}
          stroke={c} strokeWidth="2.2" strokeLinecap="round"
        />
      );
    });
    return (
      <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="140" r="54" stroke={c} strokeWidth="2.2" />
        <circle cx="140" cy="140" r="22" fill={c} opacity="0.55" />
        {spikes}
        <circle cx="78" cy="78" r="26" stroke={c} strokeWidth="1.8" opacity="0.65" />
        <circle cx="212" cy="210" r="20" stroke={c} strokeWidth="1.5" opacity="0.5" />
      </svg>
    );
  }
  if (themeId === "biochemistry") {
    const N = 9;
    const SH = 300;
    const strands = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const y = 14 + t * (SH - 28);
      const ox = Math.sin(t * 2 * Math.PI) * 52;
      const nt = (i + 1) / (N - 1);
      const ny = 14 + nt * (SH - 28);
      const nox = Math.sin(nt * 2 * Math.PI) * 52;
      return (
        <g key={i}>
          <ellipse cx={130 + ox} cy={y} rx="19" ry="7" stroke={c} strokeWidth="1.8" />
          {i < N - 1 && (
            <line
              x1={130 + ox} y1={y} x2={130 - nox} y2={ny}
              stroke={c} strokeWidth="1" opacity="0.5" strokeLinecap="round"
            />
          )}
        </g>
      );
    });
    return (
      <svg width="260" height={SH + 10} viewBox={`0 0 260 ${SH + 10}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {strands}
      </svg>
    );
  }
  if (themeId === "neurology" || themeId === "small_rotations") {
    return (
      <svg width="280" height="270" viewBox="0 0 280 270" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M90 135 C85 80 102 32 140 30 C178 32 195 80 190 135 C185 178 168 204 140 218 C112 204 95 178 90 135Z"
          stroke={c} strokeWidth="2.2" strokeLinejoin="round"
        />
        <path
          d="M140 30 C143 72 148 104 153 130 C158 155 168 172 140 184 C112 172 122 155 127 130 C132 104 137 72 140 30Z"
          stroke={c} strokeWidth="1.2" opacity="0.6"
        />
        <path d="M90 112 C68 96 54 68 76 52 C98 38 120 62 132 90" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M190 112 C212 96 226 68 204 52 C182 38 160 62 148 90" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (themeId === "pulmonology" || themeId === "anatomy") {
    return (
      <svg width="290" height="280" viewBox="0 0 290 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M145 46 L145 190" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M145 68 C102 56 68 88 63 132 C58 170 80 204 112 218 C122 180 117 138 145 68Z"
          stroke={c} strokeWidth="2.2" fill="none" strokeLinejoin="round"
        />
        <path
          d="M145 68 C188 56 222 88 227 132 C232 170 210 204 178 218 C168 180 173 138 145 68Z"
          stroke={c} strokeWidth="2.2" fill="none" strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (themeId === "physiology" || themeId === "nephrology") {
    return (
      <svg width="290" height="250" viewBox="0 0 290 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M88 46 C44 58 40 146 78 182 C100 200 124 168 124 118 C124 68 104 42 88 46Z"
          stroke={c} strokeWidth="2.2" fill="none" strokeLinejoin="round"
        />
        <path
          d="M202 46 C246 58 250 146 212 182 C190 200 166 168 166 118 C166 68 186 42 202 46Z"
          stroke={c} strokeWidth="2.2" fill="none" strokeLinejoin="round"
        />
        <ellipse cx="145" cy="114" rx="21" ry="32" stroke={c} strokeWidth="1.8" />
        <line x1="88" y1="118" x2="124" y2="118" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="166" y1="118" x2="202" y2="118" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (themeId === "pharmacology") {
    return (
      <svg width="280" height="268" viewBox="0 0 280 268" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="88" r="40" stroke={c} strokeWidth="2.2" />
        <circle cx="76" cy="182" r="30" stroke={c} strokeWidth="1.8" opacity="0.85" />
        <circle cx="204" cy="182" r="30" stroke={c} strokeWidth="1.8" opacity="0.85" />
        <line x1="108" y1="110" x2="92" y2="158" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="172" y1="110" x2="188" y2="158" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="76" y1="212" x2="204" y2="212" stroke={c} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (themeId === "pathology") {
    return (
      <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="140" r="60" stroke={c} strokeWidth="2" />
        <circle cx="140" cy="140" r="30" stroke={c} strokeWidth="1.5" opacity="0.7" />
        <circle cx="140" cy="140" r="8" fill={c} opacity="0.55" />
        <circle cx="80" cy="80" r="20" stroke={c} strokeWidth="1.5" opacity="0.5" />
        <circle cx="200" cy="90" r="16" stroke={c} strokeWidth="1.3" opacity="0.4" />
        <circle cx="90" cy="200" r="18" stroke={c} strokeWidth="1.3" opacity="0.45" />
      </svg>
    );
  }
  if (themeId === "endocrinology") {
    return (
      <svg width="280" height="260" viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="120" r="42" stroke={c} strokeWidth="2" />
        <circle cx="140" cy="120" r="14" fill={c} opacity="0.4" />
        <path d="M98 100 Q80 80 70 55" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M182 100 Q200 80 210 55" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="70" cy="52" r="10" stroke={c} strokeWidth="1.5" opacity="0.7" />
        <circle cx="210" cy="52" r="10" stroke={c} strokeWidth="1.5" opacity="0.7" />
        <path d="M100 162 Q140 195 180 162" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      </svg>
    );
  }
  return (
    <svg width="280" height="268" viewBox="0 0 280 268" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="140" cy="102" r="36" stroke={c} strokeWidth="2" />
      <circle cx="78" cy="192" r="24" stroke={c} strokeWidth="1.8" opacity="0.8" />
      <circle cx="202" cy="192" r="24" stroke={c} strokeWidth="1.8" opacity="0.8" />
      <circle cx="140" cy="50" r="15" stroke={c} strokeWidth="1.5" opacity="0.65" />
      <line x1="140" y1="65" x2="140" y2="66" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="107" y1="120" x2="92" y2="173" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="173" y1="120" x2="188" y2="173" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Premium HTML/CSS post card (1080×1350, Instagram 4:5 feed).
 * @param {{ ders: string, konu: string, questionText: string, options: Array,
 *           showAnswer?: boolean, correctIndex?: number, explanation?: string,
 *           previewWidth?: number|null }} props
 */
export default function StoryCard({
  ders = "",
  konu = "",
  questionText = "",
  options = [],
  showAnswer = false,
  correctIndex = -1,
  explanation = "",
  previewWidth = null,
}) {
  const theme = useMemo(() => getTopicTheme({ ders, konu }), [ders, konu]);
  const palette = useMemo(() => themeToPalette(theme), [theme]);

  const accent = palette.accent;
  const accentBright = palette.accentBright;
  const ar = hexToRgb(accent);
  const abr = hexToRgb(accentBright);

  const qSize = questionFontSize(questionText);
  const optSize = optionFontSize(options);

  const W = 1080;
  const H = 1350;
  const scale = previewWidth ? previewWidth / W : 1;

  const bg = [
    `radial-gradient(ellipse 82% 58% at 84% 7%, rgba(${abr}, 0.42) 0%, transparent 58%)`,
    `radial-gradient(ellipse 55% 44% at 14% 90%, rgba(${ar}, 0.26) 0%, transparent 54%)`,
    `radial-gradient(ellipse 70% 50% at 50% 36%, rgba(${ar}, 0.07) 0%, transparent 64%)`,
    `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 38%)`,
    "linear-gradient(180deg, #01030f 0%, #060c1a 28%, #03080f 66%, #01030f 100%)",
  ].join(", ");

  const shownOpts = (options || []).slice(0, 5);
  const dersBadge = [
    (ders || "TUSOSKOP").toLocaleUpperCase("tr-TR"),
    konu ? konu.toLocaleUpperCase("tr-TR") : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const card = (
    <div
      style={{
        width: W,
        height: H,
        background: bg,
        fontFamily: "'Inter', 'Space Grotesk', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 54,
          right: 54,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: `rgba(${abr}, 0.72)`,
          }}
        >
          TUSOSKOP
        </span>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: `rgba(${ar}, 0.14)`,
            border: `1.5px solid rgba(${ar}, 0.38)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 900,
            color: accentBright,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          T
        </div>
      </div>

      {/* Anatomy decoration – top right */}
      <div
        style={{
          position: "absolute",
          top: 88,
          right: 42,
          opacity: 0.20,
          filter: `drop-shadow(0 0 48px rgba(${abr}, 0.38))`,
          pointerEvents: "none",
        }}
      >
        <AnatomyDecor themeId={theme.id} color={accentBright} />
      </div>

      {/* Anatomy decoration – small, center-left */}
      <div
        style={{
          position: "absolute",
          top: 336,
          left: 16,
          opacity: 0.07,
          transform: "scale(0.52)",
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <AnatomyDecor themeId={theme.id} color={accentBright} />
      </div>

      {/* Content zone */}
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 48,
          right: 48,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Subject + konu badge */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              padding: "9px 26px",
              borderRadius: 40,
              background: `rgba(${ar}, 0.12)`,
              border: `1.5px solid rgba(${ar}, 0.38)`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: accentBright,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {dersBadge}
          </div>
        </div>

        {/* Kicker — only on question slide */}
        {!showAnswer && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "0.22em",
              color: "rgba(218, 230, 244, 0.86)",
            }}
          >
            S O R U
          </div>
        )}

        {/* Answer banner — only on answer slide */}
        {showAnswer && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "0.14em",
              color: "#34d399",
            }}
          >
            ✓ DOĞRU CEVAP
          </div>
        )}

        {/* Question card */}
        <div
          style={{
            background: "rgba(5, 10, 30, 0.74)",
            border: `1px solid rgba(${ar}, 0.28)`,
            borderRadius: 18,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "26px 32px",
            boxShadow: `0 8px 36px rgba(0,0,0,0.52), 0 0 80px rgba(${ar}, 0.06)`,
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: qSize,
              fontWeight: 800,
              lineHeight: 1.4,
              color: "#dde6f0",
              margin: 0,
            }}
          >
            {questionText}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {shownOpts.map((opt, i) => {
            const letter = opt.letter || String.fromCharCode(65 + i);
            const text = opt.text || String(opt || "");
            const isCorrect = showAnswer && i === correctIndex;
            const isDimmed = showAnswer && !isCorrect;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: isCorrect
                    ? "rgba(16, 185, 129, 0.18)"
                    : "rgba(5, 8, 25, 0.66)",
                  border: isCorrect
                    ? "1.5px solid rgba(52, 211, 153, 0.55)"
                    : "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 12,
                  padding: "13px 20px",
                  minHeight: 62,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  opacity: isDimmed ? 0.82 : 1,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: isCorrect
                      ? "rgba(16, 185, 129, 0.80)"
                      : `rgba(${ar}, 0.70)`,
                    border: isCorrect
                      ? "1px solid rgba(52, 211, 153, 0.60)"
                      : `1px solid rgba(${abr}, 0.42)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  {isCorrect ? "✓" : letter}
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: optSize,
                    fontWeight: isCorrect ? 700 : 600,
                    color: isCorrect ? "#a7f3d0" : "#c8d6e5",
                    lineHeight: 1.36,
                  }}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Explanation — only on answer slide */}
        {showAnswer && explanation && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(52, 211, 153, 0.20)",
              borderRadius: 12,
              padding: "14px 20px",
              fontFamily: "'Inter', sans-serif",
              fontSize: 17,
              fontWeight: 500,
              color: "#8fa0b0",
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
            }}
          >
            {explanation}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          color: "#6b7a8d",
          letterSpacing: "0.02em",
        }}
      >
        {showAnswer ? "tusoskop.com" : "Cevabını yorumlara yaz · tusoskop.com"}
      </div>
    </div>
  );

  if (!previewWidth) return card;

  return (
    <div
      style={{
        width: previewWidth,
        height: Math.round(H * scale),
        overflow: "hidden",
        position: "relative",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {card}
      </div>
    </div>
  );
}
