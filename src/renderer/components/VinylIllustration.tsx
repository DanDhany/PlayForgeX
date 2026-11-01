import React from "react";

interface VinylIllustrationProps {
  className?: string;
  spinning?: boolean;
}

export const VinylIllustration: React.FC<VinylIllustrationProps> = ({
  className = "w-48 h-48",
  spinning = false,
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 via-primary/20 to-purple-600/20 rounded-full blur-2xl -z-10 animate-pulse" />

      {/* SVG Turntable Vinyl Vector */}
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-2xl ${spinning ? "animate-spin-slow" : ""}`}
      >
        <defs>
          {/* Vinyl Body Gradient */}
          <radialGradient id="vinylBody" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2A3241" />
            <stop offset="35%" stopColor="#141923" />
            <stop offset="70%" stopColor="#0B0E14" />
            <stop offset="98%" stopColor="#181F2C" />
            <stop offset="100%" stopColor="#0F131C" />
          </radialGradient>

          {/* Vinyl Sheen Reflex Gradient */}
          <linearGradient id="vinylSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="25%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="75%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
          </linearGradient>

          {/* Label Gradient (YTM Red to Apple Crimson) */}
          <linearGradient id="labelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0000" />
            <stop offset="50%" stopColor="#FA2D48" />
            <stop offset="100%" stopColor="#D60029" />
          </linearGradient>

          {/* Groove Stroke Pattern */}
          <radialGradient id="grooveGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="85%" stopColor="rgba(250, 45, 72, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Outer Vinyl Base */}
        <circle cx="120" cy="120" r="114" fill="url(#vinylBody)" stroke="#263143" strokeWidth="2" />

        {/* Concentric Audio Grooves */}
        <circle cx="120" cy="120" r="105" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="120" cy="120" r="96" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="120" cy="120" r="87" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5 3" />
        <circle cx="120" cy="120" r="78" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="120" cy="120" r="69" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="120" cy="120" r="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Subtle Ambient Groove Glow Ring */}
        <circle cx="120" cy="120" r="90" fill="url(#grooveGlow)" />

        {/* Light Reflex / Vinyl Sheen Cone */}
        <circle cx="120" cy="120" r="114" fill="url(#vinylSheen)" />

        {/* Center Label Area */}
        <circle cx="120" cy="120" r="44" fill="url(#labelGrad)" stroke="#FFE4E8" strokeWidth="1.5" />
        <circle cx="120" cy="120" r="38" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />

        {/* Japanese Typography Accent watermark inside label */}
        <text
          x="120"
          y="108"
          textAnchor="middle"
          fill="rgba(255,255,255,0.95)"
          fontSize="10"
          fontFamily="Noto Sans JP, sans-serif"
          fontWeight="bold"
          letterSpacing="2"
        >
          音楽転送
        </text>

        <text
          x="120"
          y="122"
          textAnchor="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize="7"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          letterSpacing="1.5"
        >
          PLAYFORGEX
        </text>

        <text
          x="120"
          y="134"
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="5"
          fontFamily="JetBrains Mono, monospace"
        >
          33⅓ RPM • STUDIO
        </text>

        {/* Center Spindle Hole */}
        <circle cx="120" cy="120" r="8" fill="#0B0E14" stroke="#475569" strokeWidth="2" />
        <circle cx="120" cy="120" r="3" fill="#1E293B" />
      </svg>
    </div>
  );
};
