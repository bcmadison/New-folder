import { useState } from 'react'
import { SmartControlsBar } from '@/components/controls/SmartControlsBar'
import { PerformanceChart } from '@/components/analytics/PerformanceChart'
import { ROIAnalysis } from '@/components/analytics/ROIAnalysis'
import { PredictionAccuracy } from '@/components/analytics/PredictionAccuracy'
import { MLInsights } from '@/components/analytics/MLInsights'

export const Analytics = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <SmartControlsBar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Analytics
        </h1>
        
        {/* Traditional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PerformanceChart />
          <ROIAnalysis />
          <div className="lg:col-span-2">
            <PredictionAccuracy />
          </div>
        </div>

        {/* ML-Powered Insights */}
        {selectedEvent && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered Insights
            </h2>
            <MLInsights
              eventId={selectedEvent}
              historicalData={historicalData}
            />
          </div>
        )}
      </div>
    </div>
  )
} 