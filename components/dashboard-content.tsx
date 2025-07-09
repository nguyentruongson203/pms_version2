"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarDays, Clock, FolderOpen, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

interface DashboardContentProps {
  data: {
    projects: any[]
    tasks: any[]
    activities: any[]
  }
  user: any
}

export function DashboardContent({ data, user }: DashboardContentProps) {
  const { projects, tasks, activities } = data

  const getStatusColor = (status: string) => {
    const colors = {
      planning: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      todo: "bg-blue-100 text-blue-800",
      done: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">PMS Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Badge variant="outline">{user.role}</Badge>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FolderOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hours This Week</p>
                  <p className="text-2xl font-bold text-gray-900">32</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Projects */}
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>Projects you're involved in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 5).map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.project_code}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                        <Badge variant="outline">{project.user_role}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={project.status === "completed" ? 100 : 65} className="w-20 mb-2" />
                      <p className="text-xs text-gray-500">65% complete</p>
                    </div>
                  </div>
                ))}
                <Link href="/projects">
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Projects
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.project_name}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      {task.due_date && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Link href="/tasks">
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Tasks
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 8).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{activity.user_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span> {activity.action}{" "}
                      {activity.task_title && <span className="font-medium">"{activity.task_title}"</span>}
                      {activity.project_name && <span className="text-gray-600"> in {activity.project_name}</span>}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
