import type { Metadata } from 'next'
import '@srayner02/svix-admin/styles.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Svix Admin Demo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
