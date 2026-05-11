import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '사주 AI — 사주명리 기반 AI 패턴 분석',
  description: '사주팔자 기반 AI 성격 분석 및 의사결정 지원 플랫폼',
  keywords: ['사주', '사주팔자', '명리학', 'AI 운세', '사주 분석'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-indigo-600">
              ✦ 사주 AI
            </a>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <a href="/new" className="hover:text-indigo-600 transition-colors">사주 보기</a>
              <a href="/" className="hover:text-indigo-600 transition-colors">소개</a>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-xs text-gray-400">
          <p>사주 AI는 전통 명리학을 기반으로 한 패턴 분석 도구입니다. 중요한 결정은 전문가와 상담하세요.</p>
          <p className="mt-1">© 2026 Saju AI. All rights reserved.</p>
        </footer>
      </body>
    </html>
  )
}
