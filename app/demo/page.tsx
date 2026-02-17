"use client"

import { DemoScenarios } from "@/components/demo-scenarios"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function DemoContent() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-col gap-6 p-5 lg:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quick Demo Scenarios</h2>
          <p className="text-sm text-muted-foreground">
            Click a scenario below to generate a digital twin and see Sentinel in action.
          </p>
        </div>

        <DemoScenarios />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Each scenario creates a digital twin with realistic behavioral patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="font-medium text-foreground">1. Digital Twin</div>
                <p className="mt-1">We generate an employee profile with realistic work patterns</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-medium text-foreground">2. Risk Analysis</div>
                <p className="mt-1">Our AI analyzes behavioral signals and calculates risk scores</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-medium text-foreground">3. Insights</div>
                <p className="mt-1">You see burnout detection, talent discovery, or contagion warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function DemoPage() {
  return (
    <ProtectedRoute>
      <DemoContent />
    </ProtectedRoute>
  )
}
