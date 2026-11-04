import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ANNOUNCEMENT_MEDIA_BUCKET,
  deleteAnnouncementMedia,
  listPublishedAnnouncements,
  uploadAnnouncementMedia
} from '../src/announcements.js'

test('public announcements request published rows and resolve private media URLs', async () => {
  const calls = []
  const client = {
    from(table) {
      assert.equal(table, 'announcements')
      return {
        select(columns) { calls.push(['select', columns]); return this },
        eq(column, value) { calls.push(['eq', column, value]); return this },
        order(column, options) { calls.push(['order', column, options]); return this },
        limit(count) {
          calls.push(['limit', count])
          return Promise.resolve({
            data: [
              { id: 'notice-1', published: true, media_path: 'notice-1/image.png', media_type: 'image' },
              { id: 'notice-2', published: true, media_path: null, media_type: null }
            ],
            error: null
          })
        }
      }
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, ANNOUNCEMENT_MEDIA_BUCKET)
        return {
          async createSignedUrl(path, expiresIn) {
            calls.push(['signed', path, expiresIn])
            return { data: { signedUrl: `https://media.example/${path}` }, error: null }
          }
        }
      }
    }
  }

  const announcements = await listPublishedAnnouncements(client)
  assert.equal(announcements[0].media_url, 'https://media.example/notice-1/image.png')
  assert.equal(announcements[1].media_url, '')
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'published' && call[2] === true))
  assert.deepEqual(calls.find((call) => call[0] === 'signed'), ['signed', 'notice-1/image.png', 3600])
})

test('announcement media uploads validate type and size and can be removed', async () => {
  const calls = []
  const client = {
    storage: {
      from(bucket) {
        assert.equal(bucket, ANNOUNCEMENT_MEDIA_BUCKET)
        return {
          async upload(path, file, options) {
            calls.push(['upload', path, file, options])
            return { error: null }
          },
          async remove(paths) {
            calls.push(['remove', paths])
            return { error: null }
          }
        }
      }
    }
  }
  const media = await uploadAnnouncementMedia(client, {
    name: 'announcement image.png',
    size: 12,
    type: 'image/png'
  }, 'notice-1')
  assert.equal(media.type, 'image')
  assert.match(media.path, /^notice-1\/[0-9a-f-]+-announcement-image\.png$/i)
  await assert.rejects(uploadAnnouncementMedia(client, { name: 'bad.exe', size: 12, type: 'application/octet-stream' }, 'notice-1'), /supported image or video/)
  await deleteAnnouncementMedia(client, media.path)
  assert.equal(calls.filter((call) => call[0] === 'upload').length, 1)
  assert.deepEqual(calls.find((call) => call[0] === 'remove'), ['remove', [media.path]])
})
