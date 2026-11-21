import TitleBand from '@/components/TitleBand'
import StickerChip from '@/components/StickerChip'
import { STICKERS } from '@/lib/stickers'

// Step 2's front page: the shell only (header, band, stickers). Step 3 adds the threads.
export default function Home() {
  return (
    <div className="rb-wrap">
      <TitleBand />
      <p className="rb-soon">చర్చలు త్వరలో ఇక్కడ కనిపిస్తాయి.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
        {STICKERS.map((s) => <StickerChip key={s.code} label={s.label} tone={s.tone} />)}
      </div>
    </div>
  )
}
