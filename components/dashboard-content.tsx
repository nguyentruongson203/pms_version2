"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, FolderOpen, Plus, TrendingUp, Users, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface DashboardContentProps {
  user: any
  data: {
    projects: any[]
    tasks: any[]
    activities: any[]
    stats: any
  }
}

export function DashboardContent({ user, data }: DashboardContentProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      planning: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      under_review: "bg-purple-100 text-purple-800",
      backlog: "bg-gray-100 text-gray-800",
      todo: "bg-blue-100 text-blue-800",
      in_review: "bg-purple-100 text-purple-800",
      testing: "bg-orange-100 text-orange-800",
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "project_created":
        return <FolderOpen className="h-4 w-4" />
      case "task_created":
        return <Plus className="h-4 w-4" />
      case "task_status_updated":
        return <CheckCircle className="h-4 w-4" />
      case "comment_added":
        return <Users className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/projects">
                <Button variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View Projects
                </Button>
              </Link>
              <Link href="/projects">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.total_projects || 0}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.assigned_tasks || 0}</div>
              <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.completed_tasks || 0}</div>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.stats.overdue_tasks || 0}</div>
              <p className="text-xs text-muted-foreground">Tasks past due date</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Recent Projects</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your latest project activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.projects.slice(0, 3).map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.project_code}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                          <span className="text-sm text-gray-500">{project.task_count} tasks</span>
                        </div>
                      </div>
                    ))}
                    {data.projects.length === 0 && <p className="text-gray-500 text-sm">No projects found</p>}
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
                    {data.tasks.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <p className="text-xs text-gray-600">{task.project_name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    ))}
                    {data.tasks.length === 0 && <p className="text-gray-500 text-sm">No tasks assigned</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
                <CardDescription>Your task completion progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Task Completion Rate</span>
                      <span>
                        {data.stats.assigned_tasks > 0
                          ? Math.round((data.stats.completed_tasks / data.stats.assigned_tasks) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        data.stats.assigned_tasks > 0
                          ? (data.stats.completed_tasks / data.stats.assigned_tasks) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
                <CardDescription>Projects you're involved in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.projects.map((project: any) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-gray-600">{project.project_code}</p>
                        </div>
                        <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{project.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{project.task_count} tasks</span>
                        <Link href={`/projects/${project.id}/kanban`}>
                          <Button size="sm">View Kanban</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>All tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.tasks.map((task: any) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-gray-600">
                            {task.project_name} ({task.project_code})
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                        </div>
                      </div>
                      {task.description && <p className="text-sm text-gray-700 mb-3">{task.description}</p>}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Updated {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}</span>
                        {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest activities across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">{getActionIcon(activity.action)}</div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user_name}</span>{" "}
                          {activity.action === "project_created" && "created project"}
                          {activity.action === "task_created" && "created task"}
                          {activity.action === "task_status_updated" && "updated task status"}
                          {activity.action === "comment_added" && "added a comment"}{" "}
                          {activity.project_name && <span className="text-blue-600">{activity.project_name}</span>}
                          {activity.task_title && <span className="text-blue-600"> - {activity.task_title}</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {data.activities.length === 0 && <p className="text-gray-500 text-sm">No recent activity</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
