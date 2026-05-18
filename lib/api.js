const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/forum'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  })

  if (!res.ok) {
    let message = `API error: ${res.status}`
    try {
      const data = await res.json()
      message = data.message || data.error || message
    } catch (_) {}
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

// Categories
export async function getCategories() {
  return request('/categories')
}

// Posts
export async function getPosts(params = {}) {
  const query = new URLSearchParams(params).toString()
  return request(`/posts${query ? `?${query}` : ''}`)
}

export async function getPost(id) {
  return request(`/posts/${id}`)
}

export async function createPost(data) {
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePost(id, data) {
  return request(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// Replies
export async function getReplies(postId) {
  return request(`/posts/${postId}/replies`)
}

export async function createReply(postId, body) {
  return request(`/posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

// Voting
export async function vote(postId, replyId) {
  if (replyId) {
    return request(`/replies/${replyId}/vote`, { method: 'POST' })
  }
  return request(`/posts/${postId}/vote`, { method: 'POST' })
}

export async function removeVote(postId, replyId) {
  if (replyId) {
    return request(`/replies/${replyId}/vote`, { method: 'DELETE' })
  }
  return request(`/posts/${postId}/vote`, { method: 'DELETE' })
}

// Definitions
export async function getDefinitions(postId) {
  return request(`/posts/${postId}/definitions`)
}

export async function createDefinition(postId, data) {
  return request(`/posts/${postId}/definitions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Image upload
export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`)
  }
  return res.json()
}

// Auth
export async function getMe() {
  return request('/auth/me')
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' })
}
