import type { Metadata } from 'next'
import { Outfit, Noto_Sans_SC } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '洋葱每日热点灵感捕手 | Onion Daily Trend Catcher',
  description: '洋葱学园内容运营团队的智能热点捕捉与内容生成工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${outfit.variable} ${notoSansSC.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-onion-blue-50 via-white to-onion-blue-50 antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-onion-blue-200/30 via-transparent to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-onion-blue-200/20 via-transparent to-transparent rounded-full blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  )
}
