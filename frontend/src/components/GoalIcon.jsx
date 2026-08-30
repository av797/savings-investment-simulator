const ICONS = {
  house: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  retirement: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
  emergency_fund: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5 4.5 6.2v5.3c0 4.7 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.8 7.5-9.5V6.2L12 3.5Z" />
      <path d="m9.5 12 1.8 1.8 3.2-3.6" />
    </svg>
  ),
  education: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5 2.5 9.5 12 14l9.5-4.5L12 5Z" />
      <path d="M6.5 11.8V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.2" />
      <path d="M21.5 9.5V15" />
    </svg>
  ),
  travel: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.5 20 12 15.5m1.5 4.5L12 15.5m0 0L4 12.8V11l7.2-2V4.8a1.2 1.2 0 1 1 2.4 0V9l7.2 2v1.8L13 15.5" />
    </svg>
  ),
  other: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
}

export default function GoalIcon({ type, className = 'w-5 h-5' }) {
  const Icon = ICONS[type] || ICONS.other
  return <Icon className={className} />
}