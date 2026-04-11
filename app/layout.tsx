import React from "react"
import type { Metadata, Viewport } from 'next'

export const dynamic = 'force-dynamic'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthProvider } from '@/contexts/auth-context'
import { TenantProvider } from '@/contexts/tenant-context'
import { ThemeProvider } from '@/components/theme-provider'
import { ClientLayout } from "@/components/layout/client-layout"
import { AmbientBackground } from "@/components/ambient-background"
import { RouteProgressBar } from "@/components/route-progress-bar"
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

export const metadata: Metadata = {
  title: 'Sentinel — AI-Powered Employee Insights',
  description: 'Privacy-first burnout detection, talent discovery, and team health monitoring.',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <AmbientBackground />
          <RouteProgressBar />
          <AuthProvider>
            <TenantProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </TenantProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
