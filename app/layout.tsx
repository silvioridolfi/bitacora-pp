import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Encode_Sans, Roboto } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const encodeSans = Encode_Sans({
  subsets: ['latin'],
  variable: '--font-encode-sans',
  weight: ['400', '500', '600', '700', '800'],
})

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Prácticas Profesionalizantes DTE',
  description:
    'Sistema de gestión de Prácticas Profesionalizantes en la Dirección de Tecnología Educativa (DTE), Región 1.',
  generator: 'v0.app',
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
  colorScheme: 'light',
  themeColor: '#0d3b52',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${encodeSans.variable} ${roboto.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
