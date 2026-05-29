import Avatar from '@/components/shared/Avatar'
import Badge from '@/components/shared/Badge'

function DefinitionItem({ definition, isTop }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isTop
          ? 'border-amber-300 bg-amber-50 shadow-sm'
          : 'border-stone-200 bg-white'
      }`}
    >
      {isTop && (
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs font-semibold text-amber-700">Top Answer · ఉత్తమ జవాబు</span>
        </div>
      )}

      {/* Definition text */}
      <p className="text-slate-800 text-base leading-relaxed mb-3">
        {definition.definition}
      </p>

      {/* Example */}
      {definition.example && (
        <div className="bg-stone-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-stone-500 mb-0.5">ఉదాహరణ · Example</p>
          <p className="text-sm text-slate-600 italic">{definition.example}</p>
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-400">
        {definition.region && <Badge type="region" value={definition.region} />}
        {definition.author && (
          <span className="flex items-center gap-1">
            <Avatar user={definition.author} size="xs" />
            {definition.author.name || definition.author.username}
          </span>
        )}
        {definition.vote_count != null && (
          <span className="flex items-center gap-1 text-amber-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            {definition.vote_count}
          </span>
        )}
      </div>
    </div>
  )
}

export default function DefinitionList({ definitions = [] }) {
  if (definitions.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <p className="text-lg mb-1">నిర్వచనాలు లేవు</p>
        <p className="text-sm">No definitions yet — be the first to add one!</p>
      </div>
    )
  }

  // Sort by vote_count descending
  const sorted = [...definitions].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))

  return (
    <div className="space-y-3">
      {sorted.map((def, idx) => (
        <DefinitionItem key={def.id ?? idx} definition={def} isTop={idx === 0} />
      ))}
    </div>
  )
}
