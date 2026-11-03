import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Step 4B remains 16 read-only inspection queries with the approved access label', async () => {
  const sql = await readFile(new URL('../supabase/verification/step-4b-live-inspection.sql', import.meta.url), 'utf8')
  const sectionNumbers = [...sql.matchAll(/^--\s+(\d+)\./gm)].map((match) => Number(match[1]))
  const uncommented = sql.replace(/--[^\r\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  const statements = uncommented.split(';').map((statement) => statement.trim()).filter(Boolean)
  const nonSelectStatements = statements.filter((statement) => !/^select\b/i.test(statement))
  const sqlTokens = uncommented.replace(/'(?:''|[^'])*'/g, "''")

  assert.deepEqual(sectionNumbers, Array.from({ length: 16 }, (_, index) => index + 1))
  assert.equal(statements.length, 16)
  assert.deepEqual(nonSelectStatements, [])
  assert.doesNotMatch(sqlTokens, /\b(insert|update|delete|create|alter|drop|truncate)\b/i)
  assert.match(sql, /has_table_privilege\(current_user, object_oid, 'SELECT'\) then 'OBJECT SELECT GRANTED'/)
})