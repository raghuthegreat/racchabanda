export default function Avatar({ user, size = 'md' }) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  const name = user?.name || user?.username || 'U'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (user?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-2 border-amber-200`}
      />
    )
  }

  // Color based on first char code for variety
  const colors = [
    'bg-amber-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-rose-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  const bgColor = colors[colorIndex]

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
