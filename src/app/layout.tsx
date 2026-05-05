import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper'

export const metadata: Metadata = {
  title: '待办清单',
  description: '简洁高效的待办事项管理应用',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '待办清单',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  )
}
