import React from "react";

// 1. 3D Shiny Golden Bell
export const GoldenBell3D: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg
    viewBox="0 0 100 100"
    className={`filter drop-shadow-[0_15px_15px_rgba(234,179,8,0.4)] ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="goldGloss" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#fffae0" />
        <stop offset="25%" stopColor="#fbbf24" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </radialGradient>
      <linearGradient id="goldHighlight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="clapperGold" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#451a03" />
      </radialGradient>
    </defs>

    {/* Clapper ball at bottom */}
    <circle cx="50" cy="78" r="11" fill="url(#clapperGold)" />

    {/* Main Bell Body */}
    <path
      d="M50 12 C44 12 40 16 40 22 C40 25 36 28 32 34 C24 46 16 58 16 68 C16 72 30 76 50 76 C70 76 84 72 84 68 C84 58 76 46 68 34 C64 28 60 25 60 22 C60 16 56 12 50 12 Z"
      fill="url(#goldGloss)"
    />

    {/* Top Ring / Handle */}
    <path
      d="M50 6 C45 6 42 9 42 14 C46 14 54 14 58 14 C58 9 55 6 50 6 Z"
      fill="url(#goldGloss)"
    />

    {/* 3D Shiny Specular Highlight */}
    <path
      d="M44 20 C42 22 36 32 30 46 C24 58 22 66 22 68 C28 70 38 70 42 70 C42 66 40 56 46 44 C50 34 52 26 52 20 Z"
      fill="url(#goldHighlight)"
    />
  </svg>
);

// 2. 3D Shiny Calendar Card (DEC 31)
export const Calendar3D: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg
    viewBox="0 0 100 100"
    className={`filter drop-shadow-[0_15px_15px_rgba(225,29,72,0.35)] ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="redHeader" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
      <linearGradient id="whitePage" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>

    {/* Main White Calendar 3D Block */}
    <rect x="12" y="18" width="76" height="68" rx="16" fill="url(#whitePage)" />
    
    {/* Top Glossy Red Header Bar */}
    <path
      d="M12 34 C12 25 19 18 28 18 L72 18 C81 18 88 25 88 34 L88 40 L12 40 Z"
      fill="url(#redHeader)"
    />

    {/* Ring Binder Loops */}
    <rect x="28" y="10" width="8" height="16" rx="4" fill="#64748b" />
    <rect x="64" y="10" width="8" height="16" rx="4" fill="#64748b" />

    {/* Header Text */}
    <text x="50" y="34" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="sans-serif">
      DEC
    </text>

    {/* Big 31 Date Number */}
    <text x="50" y="72" textAnchor="middle" fill="#0f172a" fontSize="30" fontWeight="900" fontFamily="sans-serif">
      31
    </text>
  </svg>
);

// 3. 3D Shiny Cash Stack (Rp / Budget)
export const BudgetCash3D: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg
    viewBox="0 0 100 100"
    className={`filter drop-shadow-[0_15px_15px_rgba(16,185,129,0.35)] ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="emeraldBanknote" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="60%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <radialGradient id="goldCoinGloss" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#78350f" />
      </radialGradient>
    </defs>

    {/* Back Cash Bill */}
    <rect x="18" y="24" width="64" height="38" rx="8" transform="rotate(-10 50 43)" fill="#059669" />

    {/* Main Front Cash Bill */}
    <rect x="14" y="28" width="68" height="40" rx="9" fill="url(#emeraldBanknote)" stroke="#a7f3d0" strokeWidth="2" />

    {/* Inner Bill Circle Badge */}
    <circle cx="48" cy="48" r="11" fill="#ecfdf5" opacity="0.9" />
    <text x="48" y="53" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="900" fontFamily="sans-serif">
      Rp
    </text>

    {/* Shiny 3D Gold Coin on Left */}
    <circle cx="22" cy="68" r="14" fill="url(#goldCoinGloss)" stroke="#ffffff" strokeWidth="2" />
    <text x="22" y="73" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
      Rp
    </text>

    {/* Shiny 3D Gold Coin on Right */}
    <circle cx="78" cy="62" r="12" fill="url(#goldCoinGloss)" stroke="#ffffff" strokeWidth="2" />
    <text x="78" y="66" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">
      Rp
    </text>
  </svg>
);

// 4. 3D Shiny Blue Folder
export const BlueFolder3D: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg
    viewBox="0 0 100 100"
    className={`filter drop-shadow-[0_15px_15px_rgba(37,99,235,0.4)] ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="folderBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="folderBack" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>

    {/* Back Folder Wall */}
    <path
      d="M12 28 C12 24 16 20 20 20 L38 20 C42 20 45 23 48 26 L52 30 L80 30 C85 30 88 34 88 38 L88 74 C88 78 84 82 80 82 L20 82 C15 82 12 78 12 74 Z"
      fill="url(#folderBack)"
    />

    {/* Document Papers Popping Out */}
    <rect x="28" y="16" width="44" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" transform="rotate(-6 50 42)" />
    <line x1="36" y1="28" x2="60" y2="28" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" transform="rotate(-6 50 42)" />
    <line x1="36" y1="36" x2="56" y2="36" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" transform="rotate(-6 50 42)" />
    <line x1="36" y1="44" x2="64" y2="44" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" transform="rotate(-6 50 42)" />

    {/* Front Folder Lip Cover */}
    <path
      d="M10 40 L45 40 C48 40 52 38 54 36 L58 32 L82 32 C87 32 90 36 90 40 L90 74 C90 80 85 84 80 84 L18 84 C12 84 10 80 10 74 Z"
      fill="url(#folderBlue)"
    />
  </svg>
);
