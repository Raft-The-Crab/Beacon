import test from 'node:test'
import assert from 'node:assert/strict'

// Basic health check test — requires server to start on localhost:4000
test('GET /health returns 200', async () => {
  const res = await fetch('http://localhost:4000/health')
  assert.equal(res.status, 200)
  const json = await res.json()
  assert.ok(json.status)
})
