// components/icons/Icons.tsx
// Line-icon set — stroke-based, rounded caps, matches the navy/white design system.
// Usage: <IconSave className="w-5 h-5" />

import React from "react";

interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconTrayIn({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconTrayOut({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 13V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconCheckCircle({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3L15.5 9.5" />
    </svg>
  );
}

export function IconAlertCircle({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.2v.1" />
    </svg>
  );
}

export function IconSpinner({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function IconSave({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M8 4v5h7V4" />
      <path d="M8 14h8v6H8z" />
    </svg>
  );
}

export function IconInfo({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.2" />
      <path d="M12 7.8v.1" />
    </svg>
  );
}

export function IconBarChart({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function IconSearch({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}

export function IconDownload({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v12" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4 19.5h16" />
    </svg>
  );
}

export function IconBox({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 8.2 12 4l8.5 4.2v8.6L12 21l-8.5-4.2Z" />
      <path d="M3.5 8.2 12 12l8.5-4.2" />
      <path d="M12 12v9" />
    </svg>
  );
}

export function IconPencil({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20.5h4L18.5 10 15 6.5 4.5 17v4Z" />
      <path d="M13 8.5 16.5 12" />
    </svg>
  );
}

export function IconPrinter({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="1.5" />
      <path d="M7 14h10v6.5H7Z" />
    </svg>
  );
}

export function IconChevronDown({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconChevronUp({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function IconClose({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function IconPlus({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconArrowUpRight({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function IconBoxes({ className = "w-8 h-8" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 8.2 12 4l8.5 4.2v8.6L12 21l-8.5-4.2Z" />
      <path d="M3.5 8.2 12 12l8.5-4.2" />
      <path d="M12 12v9" />
      <path d="M7.5 6.1 16 10" />
    </svg>
  );
}

export function IconUser({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5.5 20c1.2-3.6 4-5.4 6.5-5.4s5.3 1.8 6.5 5.4" />
    </svg>
  );
}

export function IconLock({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.8" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconBuilding({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 21V5.5L13 3v18" />
      <path d="M13 8.5 19 10v11" />
      <path d="M8.3 8h1.4M8.3 11h1.4M8.3 14h1.4M8.3 17h1.4" />
      <path d="M15.5 13h1.4M15.5 16h1.4" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function IconEyeOff({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 12S6.5 6 12 6s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M4 20 20 4" />
    </svg>
  );
}

export function IconEye({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 12S6.5 6 12 6s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}