// A post's photos: thumbnails (light to load), each opening the full photo. width/height come
// from the saved size, so the page doesn't jump as they load.
import { fitSize, THUMB_PX } from '@/lib/photos'

export default function PhotoGrid({ photos }) {
  if (!photos || !photos.length) return null
  return (
    <div className={`rb-photo-grid rb-photo-grid-${Math.min(photos.length, 4)}`}>
      {photos.map((p) => {
        const t = fitSize(p.w, p.h, THUMB_PX)
        return (
          <a key={p.full} href={p.full} target="_blank" rel="noopener" className="rb-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt="ఫోటో" width={t.w} height={t.h} loading="lazy" />
          </a>
        )
      })}
    </div>
  )
}
