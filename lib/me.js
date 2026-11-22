// Who is looking at this page, asked of the site once per request (the layout's header and the
// page both use it; React's cache() shares one answer).
import { cache } from 'react'
import { headers } from 'next/headers'
import { getMe } from './site.js'

export const currentMe = cache(async () => getMe((await headers()).get('cookie') || ''))
