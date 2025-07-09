"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClearSession() {
  const clearAllSessions = async () => {
    // Clear NextAuth session
    await signOut({ redirect: false })

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
    })

    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()

    // Redirect to signin
    window.location.href = "/auth/signin"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Clear Session</CardTitle>
          <CardDescription>This will clear all session data and cookies to fix JWT errors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={clearAllSessions} className="w-full">
            Clear All Sessions & Cookies
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
