'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useWizardStore, useCurrentStep } from '@/store/useWizardStore'
import { TrendDashboard } from './TrendDashboard'
import { AngleSelection } from './AngleSelection'
import { ScriptSelection } from './ScriptSelection'
import { VisualSelection } from './VisualSelection'
import { ExportView } from './ExportView'

// ============================================
// Progress Indicator Component
// ============================================

interface StepIndicatorProps {
  currentStep: number
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { id: 0, label: '热点', icon: '📡' },
    { id: 1, label: '角度', icon: '💡' },
    { id: 2, label: '脚本', icon: '📝' },
    { id: 3, label: '视觉', icon: '🎨' },
    { id: 4, label: '导出', icon: '✅' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step Circle */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
              currentStep === step.id
                ? "bg-white text-onion-blue-600 shadow-lg shadow-onion-blue-500/30 scale-105 border-2 border-onion-blue-600 font-semibold"
                : currentStep > step.id
                ? "bg-onion-blue-100 text-onion-blue-600"
                : "bg-gray-100 text-gray-400"
            )}
          >
            <span className="text-sm">{step.icon}</span>
            <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
          </div>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-6 sm:w-12 h-0.5 rounded-full transition-colors duration-300",
                currentStep > step.id ? "bg-onion-blue-400" : "bg-gray-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================
// Main Wizard Container Component
// ============================================

export function WizardContainer() {
  const currentStep = useCurrentStep()

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <TrendDashboard />
      case 1:
        return <AngleSelection />
      case 2:
        return <ScriptSelection />
      case 3:
        return <VisualSelection />
      case 4:
        return <ExportView />
      default:
        return <TrendDashboard />
    }
  }

  return (
    <div className="min-h-screen pt-8 pb-8 px-4 md:px-6 lg:px-8">
      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto mb-8">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="animate-fade-in" key={currentStep}>
        {renderStep()}
      </div>
    </div>
  )
}
