import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Sentinel</h1>
        <p className="text-muted-foreground">AI-Powered Employee Insights</p>
      </div>
      <Link href="/dashboard">
        <Button size="lg">Enter Dashboard</Button>
      </Link>
    </div>
  )
}
