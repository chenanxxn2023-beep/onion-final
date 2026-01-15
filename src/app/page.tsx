'use client'

import { Header } from '@/components/Header'
import { WizardContainer } from '@/components/wizard/WizardContainer'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Wizard Content */}
      <WizardContainer />
    </main>
  )
}
