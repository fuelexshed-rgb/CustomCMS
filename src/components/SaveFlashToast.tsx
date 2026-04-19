import { useEffect, useState } from 'react'

export type SaveFlashKind = 'draft' | 'published'

type Props = {
  kind: SaveFlashKind | null
  onDismiss: () => void
}

export function SaveFlashToast({ kind, onDismiss }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!kind || !reducedMotion) return
    const t = window.setTimeout(onDismiss, 3200)
    return () => window.clearTimeout(t)
  }, [kind, reducedMotion, onDismiss])

  if (!kind) return null

  const label = kind === 'draft' ? 'Draft saved' : 'Article published'
  const sub = kind === 'draft' ? 'Your changes are saved as a draft.' : 'The article is now live.'

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    if (e.animationName === 'saveFlashLife') onDismiss()
  }

  return (
    <div className="save-flash-anchor">
      <div
        className={`save-flash save-flash--${kind}${reducedMotion ? ' save-flash--static' : ''}`}
        role="status"
        aria-live="polite"
        onAnimationEnd={handleAnimationEnd}
      >
        <span className="save-flash__mark" aria-hidden>
          ✓
        </span>
        <div className="save-flash__text">
          <strong className="save-flash__title">{label}</strong>
          <span className="save-flash__sub">{sub}</span>
        </div>
      </div>
    </div>
  )
}
