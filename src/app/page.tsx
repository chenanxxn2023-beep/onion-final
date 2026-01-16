'use client'

import { Header } from '@/components/Header'
import { WizardContainer } from '@/components/wizard/WizardContainer'
import { CacheManager } from '@/components/CacheManager'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Wizard Content */}
      <WizardContainer />

      {/* 缓存管理工具（开发和用户使用）*/}
      <CacheManager />
    </main>
  )
}
