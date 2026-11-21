// One Telugu word sticker (lib/stickers.js) as a chip: the word in the sticker's tone, with its
// count. Step 3/4 make it a button that adds or takes back your sticker.
export default function StickerChip({ label, tone, n, mine = false }) {
  return (
    <span className={`rb-sticker rb-sticker-${tone}${mine ? ' rb-sticker-mine' : ''}`}>
      {label}{n ? <span className="rb-sticker-n">{n}</span> : null}
    </span>
  )
}
