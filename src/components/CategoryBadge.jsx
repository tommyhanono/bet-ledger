import { CATEGORY_LABELS, CATEGORY_COLORS } from '../utils/analytics'

const bg = {
  casino: 'rgba(245,158,11,0.15)',
  sports: 'rgba(14,165,233,0.15)',
  'online-gambling': 'rgba(139,92,246,0.15)',
  other: 'rgba(16,185,129,0.15)',
}

export default function CategoryBadge({ category, size = 'sm' }) {
  const color = CATEGORY_COLORS[category] || '#6b7280'
  const label = CATEGORY_LABELS[category] || category
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${px}`}
      style={{ color, background: bg[category] || 'rgba(100,100,100,0.15)' }}
    >
      {label}
    </span>
  )
}
