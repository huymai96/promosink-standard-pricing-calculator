import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Promos Ink – Price Calculator',
  description: 'Screen printing price calculator with server-side pricing logic',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
