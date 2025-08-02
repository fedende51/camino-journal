import { prisma } from '@/lib/prisma'

const RESERVED_SLUGS = [
  'api', 'admin', 'www', 'app', 'blog', 'help', 'support', 'about',
  'contact', 'privacy', 'terms', 'login', 'register', 'logout',
  'dashboard', 'settings', 'profile', 'account', 'user', 'users',
  'pilgrim', 'pilgrims', 'journal', 'journals', 'entry', 'entries',
  'photo', 'photos', 'audio', 'map', 'maps', 'gps', 'garmin',
  'static', 'assets', 'public', 'uploads', 'files', 'docs'
]

export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  // Length check
  if (slug.length < 3 || slug.length > 50) {
    return { isValid: false, error: 'Slug must be between 3-50 characters' }
  }

  // Character validation
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return { isValid: false, error: 'Slug must start and end with alphanumeric characters, and only contain lowercase letters, numbers, and hyphens' }
  }

  // Reserved words check
  if (RESERVED_SLUGS.includes(slug)) {
    return { isValid: false, error: 'This slug is reserved and cannot be used' }
  }

  return { isValid: true }
}

export async function generateUniqueSlug(name: string, year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear()
  const sanitizedName = sanitizeName(name)
  
  if (!sanitizedName) {
    throw new Error('Cannot generate slug from provided name')
  }

  let baseSlug = `${sanitizedName}-${currentYear}`
  let slug = baseSlug
  let counter = 1

  // Check if base slug is valid
  const validation = validateSlug(slug)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Keep trying until we find a unique slug
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { journalSlug: slug }
    })

    if (!existingUser) {
      return slug
    }

    counter++
    slug = `${baseSlug}-${counter}`
    
    // Safety check to prevent infinite loop
    if (counter > 999) {
      throw new Error('Unable to generate unique slug')
    }
  }
}

export function generateJournalTitle(name: string, year?: number): string {
  const currentYear = year || new Date().getFullYear()
  return `${name}'s Camino Journey ${currentYear}`
}

export async function isSlugAvailable(slug: string, userId?: string): Promise<boolean> {
  const validation = validateSlug(slug)
  if (!validation.isValid) {
    return false
  }

  const existingUser = await prisma.user.findUnique({
    where: { journalSlug: slug }
  })

  // If no existing user, slug is available
  if (!existingUser) {
    return true
  }

  // If userId provided and it matches the existing user, it's available for that user
  if (userId && existingUser.id === userId) {
    return true
  }

  return false
}