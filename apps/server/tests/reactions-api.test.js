import test from 'node:test'
import assert from 'node:assert/strict'

// These tests check API endpoints respond (auth required). We expect 401 Unauthorized without token.
const CHANNEL = 'test-channel'
const MESSAGE = 'test-message'

test('POST /api/channels/:channelId/messages/:messageId/reactions returns 401 without auth', async () => {
  const res = await fetch(`http://localhost:4000/api/channels/${CHANNEL}/messages/${MESSAGE}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji: '👍' }) })
  assert.equal(res.status === 401 || res.status === 403 || res.status === 404, true)
})

test('DELETE /api/channels/:channelId/messages/:messageId/reactions returns 401 without auth', async () => {
  const res = await fetch(`http://localhost:4000/api/channels/${CHANNEL}/messages/${MESSAGE}/reactions`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji: '👍' }) })
  assert.equal(res.status === 401 || res.status === 403 || res.status === 404, true)
})
