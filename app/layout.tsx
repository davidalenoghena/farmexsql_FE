import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'QueriumDB - Natural Language to SQL for Data Analytics & Business Intelligence',
  description: 'Turn natural language into SQL queries instantly. QueriumDB helps you generate, understand, execute, edit, and export SQL for data analytics and business intelligence without writing SQL manually.',
  keywords: [
    'sql data analytics',
    'data analysis using sql',
    'sql for data analysis',
    'data analytics with sql',
    'sql and data analytics',
    'business analytics',
    'tools for business intelligence',
    'business intelligence bi tools',
    'bi tools',
    'natural language to sql',
    'sql generator',
    'ai sql'
  ],
  openGraph: {
    title: 'QueriumDB - Natural Language to SQL for Data Analytics & Business Intelligence',
    description: 'Turn natural language into SQL queries instantly. Generate, understand, execute, edit, and export SQL for data analytics and business intelligence without writing SQL manually.',
    type: 'website',
    url: 'https://queriumdb.com',
    siteName: 'QueriumDB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QueriumDB - Natural Language to SQL for Data Analytics & Business Intelligence',
    description: 'Turn natural language into SQL queries instantly. Generate, understand, execute, edit, and export SQL for data analytics and business intelligence without writing SQL manually.',
  },
  generator: 'Extension Africa Tech Team',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9333ea' },
    { media: '(prefers-color-scheme: dark)', color: '#581c87' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script
          src="https://telltide.com/src/widgets/widget.js"
          data-app-id="63NjBLv0"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
