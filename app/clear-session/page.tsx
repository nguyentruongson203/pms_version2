"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ClearSession() {
  const router = useRouter()

  const clearAllSessions = async () => {
    try {
      // Sign out from NextAuth
      await signOut({ redirect: false })

      // Clear all localStorage
      localStorage.clear()

      // Clear all sessionStorage
      sessionStorage.clear()

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
      })

      // Redirect to signin
      router.push("/auth/signin")
      router.refresh()
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Clear Session</CardTitle>
          <CardDescription>This will clear all session data, cookies, and local storage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={clearAllSessions} className="w-full">
            Clear All Sessions & Cookies
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
