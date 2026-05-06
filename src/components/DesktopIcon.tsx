interface Props {
  label: string
  icon: string
  onClick: () => void
}

export default function DesktopIcon({ label, icon, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 w-16 group"
    >
      <div className="w-12 h-12 flex items-center justify-center text-2xl
        bg-grid-surface border border-grid-border rounded
        group-hover:border-grid-accent group-hover:shadow-glow-cyan
        transition-all duration-150">
        {icon}
      </div>
      <span className="text-xs text-grid-muted group-hover:text-grid-text
        font-mono transition-colors duration-150 text-center leading-tight">
        {label}
      </span>
    </button>
  )
}
