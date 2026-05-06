interface Props {
  label: string
  icon: string
  onClick: () => void
}

export default function DesktopIcon({ label, icon, onClick }: Props) {
  return (
    <button className="desktop-icon" onClick={onClick}>
      <div className="desktop-icon-box">{icon}</div>
      <span className="desktop-icon-label">{label}</span>
    </button>
  )
}
