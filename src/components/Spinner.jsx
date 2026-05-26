export default function Spinner({ fullScreen = false }) {
  const spinner = (
    <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin" />
  )

  if (!fullScreen) return spinner

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      {spinner}
    </div>
  )
}
