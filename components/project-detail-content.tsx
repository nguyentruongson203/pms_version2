"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { FileUploadDialog } from "@/components/file-upload-dialog"
import { Users, DollarSign, AlertTriangle, FileText, Activity, Upload, Download, Eye } from "lucide-react"
import { format } from "date-fns"

interface ProjectDetailContentProps {
  project: any
  tasks: any[]
  team: any[]
  files: any[]
  activity: any[]
}

export function ProjectDetailContent({ project, tasks, team, files, activity }: ProjectDetailContentProps) {
  const [showFileUpload, setShowFileUpload] = useState(false)

  const completedTasks = tasks.filter((task) => task.status === "done").length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-purple-100 text-purple-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-2">{project.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge className={getStatusColor(project.status)}>{project.status?.replace("_", " ").toUpperCase()}</Badge>
            <Badge className={getRiskColor(project.risk_level)}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {project.risk_level?.toUpperCase()} RISK
            </Badge>
            <Badge variant="outline">{project.methodology?.toUpperCase()}</Badge>
          </div>
        </div>
        <Button onClick={() => setShowFileUpload(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{team.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">{project.budget ? `$${project.budget.toLocaleString()}` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Project Progress</span>
              <span>
                {completedTasks}/{totalTasks} tasks completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div className="mt-1">
                    <MarkdownRenderer content={project.description || "No description provided"} />
                  </div>
                </div>

                {project.client_name && (
                  <div>
                    <label className="text-sm font-medium">Client</label>
                    <p className="text-sm text-muted-foreground">
                      {project.client_name}
                      {project.client_email && ` (${project.client_email})`}
                    </p>
                  </div>
                )}

                {project.project_manager_name && (
                  <div>
                    <label className="text-sm font-medium">Project Manager</label>
                    <p className="text-sm text-muted-foreground">{project.project_manager_name}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {project.start_date && (
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(project.start_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}

                  {project.end_date && (
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(project.end_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.repository_url && (
                  <div>
                    <label className="text-sm font-medium">Repository</label>
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      {project.repository_url}
                    </a>
                  </div>
                )}

                {project.documentation_url && (
                  <div>
                    <label className="text-sm font-medium">Documentation</label>
                    <a
                      href={project.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      {project.documentation_url}
                    </a>
                  </div>
                )}

                {project.slack_channel && (
                  <div>
                    <label className="text-sm font-medium">Slack Channel</label>
                    <p className="text-sm text-muted-foreground">#{project.slack_channel}</p>
                  </div>
                )}

                {project.jira_key && (
                  <div>
                    <label className="text-sm font-medium">JIRA Key</label>
                    <p className="text-sm text-muted-foreground">{project.jira_key}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{task.status}</Badge>
                        <Badge variant="outline">{task.priority}</Badge>
                        {task.assigned_to_name && (
                          <span className="text-sm text-muted-foreground">Assigned to {task.assigned_to_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(task.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No tasks found for this project.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4">
            {team.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={`/placeholder-user.jpg`} />
                      <AvatarFallback>{member.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{member.project_role}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {team.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No team members assigned to this project.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="grid gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{file.original_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)} • Uploaded by {file.uploaded_by_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(file.created_at), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {files.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No files uploaded for this project.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="space-y-4">
            {activity.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{log.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.user_name}</span> {log.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activity.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No activity recorded for this project.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <FileUploadDialog open={showFileUpload} onOpenChange={setShowFileUpload} projectId={project.id} />
    </div>
  )
}
