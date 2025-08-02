import { redirect } from 'next/navigation'

export default function JournalPage() {
  // Redirect /journal to the main discovery page
  // Individual journals are now at /journal/[slug]
  redirect('/')
}