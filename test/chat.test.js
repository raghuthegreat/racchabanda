// node --test: the chat view's logic (lib/chat.js): grouping, day separators, times in IST
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chatItems, dayLabel, clockTime, listTime, lastLine } from '../lib/chat.js'

// 2026-11-23 10:00 IST = 04:30 UTC
const NOW = new Date('2026-11-23T04:30:00Z')
const ist = (s) => new Date(s + '+05:30').toISOString()

test('clockTime: 12-hour clock in India time', () => {
  assert.equal(clockTime(ist('2026-11-23T09:05:00'), NOW), '9:05 AM')
  assert.equal(clockTime(ist('2026-11-22T19:10:00'), NOW), '7:10 PM')
  assert.equal(clockTime(ist('2026-11-22T00:03:00'), NOW), '12:03 AM')
  assert.equal(clockTime('2026-11-22T18:40:00Z', NOW), '12:10 AM', 'UTC evening is past midnight in India')
})

test('dayLabel: ఈ రోజు, నిన్న, then the date in Telugu (year only when not this year), by India day', () => {
  assert.equal(dayLabel(ist('2026-11-23T00:10:00'), NOW), 'ఈ రోజు')
  assert.equal(dayLabel(ist('2026-11-22T23:59:00'), NOW), 'నిన్న')
  assert.equal(dayLabel(ist('2026-11-12T08:00:00'), NOW), '12 నవంబర్')
  assert.equal(dayLabel(ist('2025-01-05T08:00:00'), NOW), '5 జనవరి 2025')
  assert.equal(dayLabel('2026-11-22T19:00:00Z', NOW), 'ఈ రోజు', '7 PM UTC on the 22nd is the 23rd in India')
})

test('listTime: a time today, నిన్న, a weekday this week, else a short date', () => {
  assert.equal(listTime(ist('2026-11-23T09:20:00'), NOW), '9:20 AM')
  assert.equal(listTime(ist('2026-11-22T21:00:00'), NOW), 'నిన్న')
  assert.equal(listTime(ist('2026-11-19T21:00:00'), NOW), 'గురువారం')
  assert.equal(listTime(ist('2026-11-10T21:00:00'), NOW), '10 నవం')
})

const P = (id, author_id, when, extra = {}) => ({ id, author_id, author_name: author_id.toUpperCase(), body: `m${id}`, created_at: ist(when), ...extra })

test('chatItems: day separators, mine marked, a run from one person grouped', () => {
  const items = chatItems([
    P(1, 'raghu', '2026-11-22T19:10:00'), P(2, 'raghu', '2026-11-22T19:11:00'),
    P(3, 'mallesh', '2026-11-23T09:01:00'),
    P(4, 'me', '2026-11-23T09:05:00'), P(5, 'me', '2026-11-23T09:06:00'),
    P(6, 'vani', '2026-11-23T09:20:00'),
  ], 'me', NOW)
  assert.deepEqual(items.map((i) => i.type === 'day' ? `[${i.label}]` : `${i.post.id}${i.mine ? 'M' : ''}${i.first ? '^' : ''}${i.last ? '$' : ''}`),
    ['[నిన్న]', '1^', '2$', '[ఈ రోజు]', '3^$', '4M^', '5M$', '6^$'])
  assert.equal(items[1].time, '7:10 PM')
})

test('chatItems: a new day starts a new group even for the same person; long gaps too', () => {
  const items = chatItems([
    P(1, 'raghu', '2026-11-22T23:58:00'), P(2, 'raghu', '2026-11-23T00:01:00'),
    P(3, 'raghu', '2026-11-23T08:00:00'),
  ], null, NOW)
  assert.deepEqual(items.map((i) => i.type === 'day' ? i.label : `${i.post.id}${i.first ? '^' : ''}`), ['నిన్న', '1^', 'ఈ రోజు', '2^', '3^'],
    'more than 30 minutes apart: a new group (name and avatar again)')
})

test('chatItems: nobody logged in -> nothing is mine; empty -> []', () => {
  assert.equal(chatItems([P(1, 'me', '2026-11-23T09:00:00')], null, NOW)[1].mine, false)
  assert.deepEqual(chatItems([], 'me', NOW), [])
})

test('lastLine: "name: newest words"; no replies yet -> the starter and the opening words', () => {
  assert.equal(lastLine({ reply_count: 3, last_author_name: 'వాణి', last_snippet: 'విజయనగరం' }), 'వాణి: విజయనగరం')
  assert.equal(lastLine({ reply_count: 0, author_name: 'సీత', body: '  మా ఊర్లో\n బేగా అంటే ' }), 'సీత: మా ఊర్లో బేగా అంటే')
  assert.equal(lastLine({ reply_count: 0, author_name: 'సీత', body: '' }), 'సీత చర్చ మొదలుపెట్టారు')
  assert.equal(lastLine({ reply_count: 2, last_author_name: '', last_snippet: '' }), '')
})
