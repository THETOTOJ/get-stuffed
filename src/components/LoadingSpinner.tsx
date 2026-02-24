const MESSAGES = [
  "Stirring the pot...",
  "Preheating the oven...",
  "Gathering ingredients...",
  "Letting it simmer...",
  "Tasting the broth...",
  "Adding a pinch of salt...",
];

export default function LoadingSpinner({ size = "md", message }: { size?: "sm" | "md" | "lg"; message?: string }) {
  const sizeMap = { sm: 48, md: 72, lg: 96 };
  const s = sizeMap[size];
  const randomMessage = message || MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2.5rem 1rem" }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Pot body */}
        <rect x="16" y="38" width="48" height="28" rx="6" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="2.5" />
        {/* Pot rim */}
        <rect x="12" y="34" width="56" height="8" rx="4" fill="var(--accent)" />
        {/* Pot handles */}
        <rect x="6" y="36" width="10" height="4" rx="2" fill="var(--accent)" />
        <rect x="64" y="36" width="10" height="4" rx="2" fill="var(--accent)" />

        {/* Steam wisps - animated */}
        <g opacity="0.7">
          <path d="M30 30 Q28 22 32 16" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" fill="none">
            <animate attributeName="d" values="M30 30 Q28 22 32 16;M30 30 Q33 20 29 14;M30 30 Q28 22 32 16" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M40 28 Q38 18 42 12" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" fill="none">
            <animate attributeName="d" values="M40 28 Q38 18 42 12;M40 28 Q43 16 39 10;M40 28 Q38 18 42 12" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2.4s" repeatCount="indefinite" />
          </path>
          <path d="M50 30 Q48 22 52 16" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" fill="none">
            <animate attributeName="d" values="M50 30 Q48 22 52 16;M50 30 Q53 20 49 14;M50 30 Q48 22 52 16" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Spoon handle sticking out, stirring */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 40 46"
            to="360 40 46"
            dur="2.5s"
            repeatCount="indefinite"
          />
          <line x1="40" y1="46" x2="58" y2="22" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <ellipse cx="59" cy="21" rx="3" ry="5" fill="var(--foreground)" opacity="0.5" transform="rotate(-35 59 21)" />
        </g>
      </svg>

      <p style={{
        color: "var(--muted)",
        fontFamily: "var(--hand-font, 'Caveat', cursive)",
        fontSize: size === "sm" ? "0.9rem" : "1.1rem",
        fontWeight: 600,
        margin: 0,
      }}>
        {randomMessage}
      </p>
    </div>
  );
}
