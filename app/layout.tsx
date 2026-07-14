import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'COAF 4.0 — Gestão Cooperativa',
  description: 'Plataforma de gestão para Cooperativas de Agricultura Familiar',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'COAF 4.0' },
}

export const viewport: Viewport = {
  themeColor: '#2A5F6B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
