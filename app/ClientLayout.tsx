"use client"

import type React from "react"

import "./globals.css"
import { Inter } from "next/font/google"
import { Suspense, useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <HydrationFix />
        </Suspense>
        {children}
      </body>
    </html>
  )
}

// This component helps suppress hydration warnings caused by browser extensions
function HydrationFix() {
  useEffect(() => {
    // This runs only on the client, after hydration
    // It helps React reconcile any differences caused by browser extensions
    document.body.classList.add("hydrated")
  }, [])

  return null
}

