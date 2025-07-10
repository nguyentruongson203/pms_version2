"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  DollarSign,
  Users,
  FileText,
  Activity,
  Plus,
  ExternalLink,
  Upload,
  Download,
  Eye,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EnhancedCreateTaskDialog } from "./enhanced-create-task-dialog"
import { EnhancedTaskDetailDialog } from "./enhanced-task-detail-dialog"
import { FileUploadDialog } from "./file-upload-dialog"
import { MarkdownRenderer } from "./markdown-renderer"

interface ProjectDetailContentProps {
  project: any
  members: any[]
  tasks: any[]
  activities: any[]
  files: any[]
  currentUser: any
}

export function ProjectDetailContent({
  project,
  members,
  tasks,
  activities,
  files,
  currentUser,
}: ProjectDetailContentProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [fileUploadOpen, setFileUploadOpen] = useState(false)

  const getStatusColor = (status: string, bgColor?: string, textColor?: string) => {
    if (bgColor && textColor) {
      return `${bgColor} ${textColor}`
    }
    return "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getRiskColor = (risk: string) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[risk as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const completedTasks = tasks.filter((task) => task.status === "done").length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Project Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge className={getStatusColor(project.status, project.bg_color, project.text_color)}>
              {project.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
            <Badge className={getRiskColor(project.risk_level)}>{project.risk_level} risk</Badge>
          </div>
          <p className="text-gray-600 mb-2">
            {project.project_code} • {project.methodology} • Created by {project.created_by_name}
          </p>
          {project.client_name && <p className="text-sm text-gray-500">Client: {project.client_name}</p>}
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          <Button variant="outline" onClick={() => setFileUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="text-2xl font-bold">{project.budget ? `$${project.budget.toLocaleString()}` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Project Progress</span>
            <span className="text-sm text-gray-600">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="team">Team ({members.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <MarkdownRenderer content={project.description} />
                ) : (
                  <p className="text-gray-500">No description provided</p>
                )}
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.start_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Start: {new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">End: {new Date(project.end_date).toLocaleDateString()}</span>
                  </div>
                )}
                {project.project_manager_name && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">PM: {project.project_manager_name}</span>
                  </div>
                )}
                {project.estimated_budget && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Estimated: ${project.estimated_budget.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Integration Links */}
          {(project.repository_url ||
            project.documentation_url ||
            project.slack_channel ||
            project.jira_project_key) && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project.repository_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Repository
                      </a>
                    </Button>
                  )}
                  {project.documentation_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.documentation_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Docs
                      </a>
                    </Button>
                  )}
                  {project.slack_channel && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {project.slack_channel}
                    </Button>
                  )}
                  {project.jira_project_key && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      JIRA: {project.jira_project_key}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTaskId(task.id)
                      setTaskDialogOpen(true)
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={getStatusColor(task.status, task.status_bg_color, task.status_text_color)}>
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {task.assigned_user_name ? `Assigned to ${task.assigned_user_name}` : "Unassigned"}
                        {task.due_date && ` • Due ${new Date(task.due_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-gray-500 text-center py-8">No tasks yet</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarFallback>{member.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                    <Badge variant="outline">{member.role.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">{file.original_name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(file.file_size)} • Uploaded by {file.uploaded_by_name} •{" "}
                          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/files/${file.id}/download`} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
                {files.length === 0 && <p className="text-gray-500 text-center py-8">No files uploaded yet</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{activity.user_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span> {activity.action.replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-600 mt-1">{JSON.parse(activity.details).project_name}</p>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-gray-500 text-center py-8">No recent activity</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EnhancedCreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={project.id}
        projectName={project.name}
      />

      <EnhancedTaskDetailDialog taskId={selectedTaskId} open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />

      <FileUploadDialog
        open={fileUploadOpen}
        onOpenChange={setFileUploadOpen}
        projectId={project.id}
        onUploadComplete={() => window.location.reload()}
      />
    </div>
  )
}
