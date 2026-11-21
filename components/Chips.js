import Link from 'next/link'
import { CHIP_REGIONS } from '@/lib/regions'

// The stream's filters: అన్నీ, పదాలు (threads about a word), the four big regions. A region
// outside the four (from a thread's chip) shows as its own chip while it is chosen.
export default function Chips({ region, words }) {
  const chips = [
    { label: 'అన్నీ', href: '/', on: !region && !words },
    { label: 'పదాలు', href: '/?words=1', on: !!words },
    ...CHIP_REGIONS.map((r) => ({ label: r, href: `/?region=${encodeURIComponent(r)}`, on: region === r })),
  ]
  if (region && !CHIP_REGIONS.includes(region)) {
    chips.push({ label: region, href: `/?region=${encodeURIComponent(region)}`, on: true })
  }
  return (
    <nav className="rb-chips" aria-label="చర్చలు వడపోత">
      {chips.map((c) => (
        <Link key={c.label} href={c.href} className={`rb-chip${c.on ? ' rb-chip-on' : ''}`} aria-current={c.on ? 'page' : undefined}>
          {c.label}
        </Link>
      ))}
    </nav>
  )
}
