import { useEffect, useState } from "react";

const MESSAGES = [
  "Stirring the pot...",
  "Preheating the oven...",
  "Gathering ingredients...",
  "Letting it simmer...",
  "Tasting the broth...",
  "Adding a pinch of salt...",
];

export default function LoadingSpinner({
  size = "md",
  message,
}: {
  size?: "sm" | "md" | "lg";
  message?: string;
}) {
  const sizeMap = { sm: 48, md: 72, lg: 96 };
  const s = sizeMap[size];

  const [displayMessage, setDisplayMessage] = useState<string | null>(
    message ?? null
  );
  useEffect(() => {
    if (!message) {
      setDisplayMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    }
  }, [message]);

  return (
    <div className="loading-spinner">
      <svg
        width={s}
        height={s}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Clip the spoon handle to only show above the rim */}
          <clipPath id="spoon-above-rim">
            <rect x="0" y="0" width="80" height="34" />
          </clipPath>
        </defs>

        {/* LAYER 1 — Pot body */}
        <rect
          x="16" y="38" width="48" height="28" rx="6"
          fill="var(--accent-light)"
          stroke="var(--accent)"
          strokeWidth="2.5"
        />

        {/* LAYER 2 — Spoon handle, clipped to above rim only.
            Two nested groups: outer moves X (slow), inner moves Y (fast, half period)
            = oval wave / stirring motion. CSS classes defined in globals.css */}
        <g clipPath="url(#spoon-above-rim)">
          <g className="spinner-stir-outer" style={{ transformOrigin: "40px 52px" }}>
            <g className="spinner-stir-inner" style={{ transformOrigin: "40px 52px" }}>
              <line
                x1="40" y1="52" x2="40" y2="18"
                stroke="var(--foreground)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.8"
              />
            </g>
          </g>
        </g>

        {/* LAYER 3 — Rim + handles paint over spoon at rim boundary */}
        <rect x="12" y="34" width="56" height="8" rx="4" fill="var(--accent)" />
        <rect x="6"  y="36" width="10" height="4" rx="2" fill="var(--accent)" />
        <rect x="64" y="36" width="10" height="4" rx="2" fill="var(--accent)" />

        {/* LAYER 4 — Steam, drawn last so it sits on top of the spoon handle */}
        <g>
          <path d="M30 32 Q26 20 31 10" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <animate attributeName="d"       values="M30 32 Q26 20 31 10;M30 32 Q34 18 28 8;M30 32 Q26 20 31 10" dur="2s"   repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8"                                                            dur="2s"   repeatCount="indefinite" />
          </path>
          <path d="M40 30 Q36 16 41 4" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <animate attributeName="d"       values="M40 30 Q36 16 41 4;M40 30 Q44 14 38 2;M40 30 Q36 16 41 4"             dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.9;0.5"                                                            dur="2.4s" repeatCount="indefinite" />
          </path>
          <path d="M50 32 Q46 20 51 10" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <animate attributeName="d"       values="M50 32 Q46 20 51 10;M50 32 Q54 18 48 8;M50 32 Q46 20 51 10"           dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.65;0.2;0.65"                                                          dur="1.8s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>

      {displayMessage && (
        <p className={`loading-spinner__message${size === "sm" ? " loading-spinner__message--sm" : ""}`}>
          {displayMessage}
        </p>
      )}
    </div>
  );
}