export function CrabLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 螃蟹身体 */}
      <ellipse cx="24" cy="28" rx="12" ry="10" fill="#C96442" />
      {/* 螃蟹眼睛 */}
      <circle cx="20" cy="16" r="3" fill="#C96442" />
      <circle cx="28" cy="16" r="3" fill="#C96442" />
      <circle cx="20" cy="15" r="1" fill="white" />
      <circle cx="28" cy="15" r="1" fill="white" />
      {/* 螃蟹钳子 */}
      <path
        d="M10 24C6 20 6 14 10 10"
        stroke="#C96442"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M38 24C42 20 42 14 38 10"
        stroke="#C96442"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* 螃蟹腿 */}
      <path d="M14 32L8 36" stroke="#C96442" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 28L6 30" stroke="#C96442" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 32L40 36" stroke="#C96442" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 28L42 30" stroke="#C96442" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
