import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { AmbientBackground } from '@/components/ambient-background'
import { RouteProgressBar } from '@/components/route-progress-bar'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Sentinel — AI-Powered Employee Insights',
  description: 'Privacy-first burnout detection, talent discovery, and team health monitoring.',
}

export const viewport: Viewport = {
  themeColor: '#121520',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <AmbientBackground />
        <RouteProgressBar />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

