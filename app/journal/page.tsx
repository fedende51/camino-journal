import { redirect } from 'next/navigation'

export default function JournalPage() {
  // Redirect /journal to the main index page
  // Since the index page now serves as the public journal view
  redirect('/')
}