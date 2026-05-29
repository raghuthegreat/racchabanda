'use client'

import { useState } from 'react'
import { vote, removeVote } from '@/lib/api'

export default function VoteButton({ postId, replyId, count = 0, voted = false }) {
  const [isVoted, setIsVoted] = useState(voted)
  const [voteCount, setVoteCount] = useState(count)
  const [loading, setLoading] = useState(false)

  async function handleVote() {
    if (loading) return
    setLoading(true)
    try {
      if (isVoted) {
        await removeVote(postId, replyId)
        setIsVoted(false)
        setVoteCount((v) => v - 1)
      } else {
        await vote(postId, replyId)
        setIsVoted(true)
        setVoteCount((v) => v + 1)
      }
    } catch (err) {
      console.error('Vote error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      aria-label={isVoted ? 'Remove vote' : 'Upvote'}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-all duration-150 select-none
        ${isVoted
          ? 'bg-amber-50 border-amber-400 text-amber-700'
          : 'bg-white border-stone-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
        }
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg
        className={`w-5 h-5 transition-transform ${isVoted ? 'scale-110' : ''}`}
        fill={isVoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      <span className="text-sm font-semibold leading-none">{voteCount}</span>
    </button>
  )
}
