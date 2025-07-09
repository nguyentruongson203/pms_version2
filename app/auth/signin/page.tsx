"use client"

import type React from "react"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("Attempting sign in with:", email)

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        console.error("Sign in error:", result.error)
        setError("Invalid credentials. Please check your email and try again.")
      } else if (result?.ok) {
        console.log("Sign in successful, redirecting...")
        // Wait for session to be established
        const session = await getSession()
        console.log("Session after sign in:", session)
        if (session) {
          router.push("/dashboard")
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("demo123")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the Project Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter any password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Demo Accounts:</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => handleDemoLogin("admin@company.com")}
                disabled={loading}
              >
                Admin: admin@company.com
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => handleDemoLogin("pm1@company.com")}
                disabled={loading}
              >
                PM: pm1@company.com
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => handleDemoLogin("dev1@company.com")}
                disabled={loading}
              >
                Dev: dev1@company.com
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-2">Password: Enter any password (demo mode)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
