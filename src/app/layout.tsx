import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KeyDash — Real-time Typing Race',
  description:
    'Race against bots and real players. Test your typing speed with detailed analytics, performance charts, and replay.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className='dark'>
      <head>
        <link rel='icon' href='/coding.png' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
      </head>
      <body className='antialiased'>{children}</body>
    </html>
  )
}
