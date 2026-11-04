export const ANNOUNCEMENT_MEDIA_BUCKET = 'announcement-media'
export const ANNOUNCEMENT_MEDIA_MAX_SIZE = 50 * 1024 * 1024

const ANNOUNCEMENT_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
])

export async function listPublishedAnnouncements(client) {
  const { data, error } = await client
    .from('announcements')
    .select('id,label,title,message,media_path,media_type')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) throw error

  return Promise.all((data || []).map(async (announcement) => {
    if (!announcement.media_path) return { ...announcement, media_url: '' }
    const { data: signedUrl, error: mediaError } = await client
      .storage
      .from(ANNOUNCEMENT_MEDIA_BUCKET)
      .createSignedUrl(announcement.media_path, 3600)
    if (mediaError) throw mediaError
    return { ...announcement, media_url: signedUrl.signedUrl }
  }))
}

export async function uploadAnnouncementMedia(client, file, announcementId) {
  if (!file || file.size <= 0 || file.size > ANNOUNCEMENT_MEDIA_MAX_SIZE || !ANNOUNCEMENT_MEDIA_TYPES.has(file.type)) {
    throw new Error('Choose a supported image or video file no larger than 50 MB.')
  }
  const safeName = file.name.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100) || 'media'
  const storagePath = `${announcementId}/${crypto.randomUUID()}-${safeName}`
  const { error } = await client.storage.from(ANNOUNCEMENT_MEDIA_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false
  })
  if (error) throw error
  return { path: storagePath, type: file.type.startsWith('video/') ? 'video' : 'image' }
}

export async function deleteAnnouncementMedia(client, storagePath) {
  if (!storagePath) return
  const { error } = await client.storage.from(ANNOUNCEMENT_MEDIA_BUCKET).remove([storagePath])
  if (error) throw error
}
