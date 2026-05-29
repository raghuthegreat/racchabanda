const STATUS_CONFIG = {
  open: {
    label: 'Open · తెరిచి ఉంది',
    classes: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  reviewing: {
    label: 'Reviewing · పరిశీలిస్తున్నారు',
    classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  planned: {
    label: 'Planned · ప్రణాళిక',
    classes: 'bg-purple-100 text-purple-700 border border-purple-200',
  },
  completed: {
    label: 'Completed · పూర్తయింది',
    classes: 'bg-green-100 text-green-700 border border-green-200',
  },
  fulfilled: {
    label: 'Fulfilled · నెరవేరింది',
    classes: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
}

const REGION_CONFIG = {
  uttarandhra: { label: 'ఉత్తరాంధ్ర', classes: 'bg-sky-100 text-sky-700 border border-sky-200' },
  rayalaseema: { label: 'రాయలసీమ', classes: 'bg-rose-100 text-rose-700 border border-rose-200' },
  telangana: { label: 'తెలంగాణ', classes: 'bg-pink-100 text-pink-700 border border-pink-200' },
  kosta: { label: 'కోస్తా', classes: 'bg-teal-100 text-teal-700 border border-teal-200' },
  diaspora: { label: 'డయాస్పోరా', classes: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
}

export default function Badge({ type = 'status', value, className = '' }) {
  if (!value) return null

  let config
  if (type === 'region') {
    config = REGION_CONFIG[value?.toLowerCase()] || {
      label: value,
      classes: 'bg-stone-100 text-stone-600 border border-stone-200',
    }
  } else {
    config = STATUS_CONFIG[value?.toLowerCase()] || {
      label: value,
      classes: 'bg-stone-100 text-stone-600 border border-stone-200',
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  )
}
