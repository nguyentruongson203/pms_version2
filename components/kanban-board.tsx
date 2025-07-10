"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock } from "lucide-react"
import { CreateTaskDialog } from "./create-task-dialog"
import { EnhancedTaskDetailDialog } from "./enhanced-task-detail-dialog"
import Link from "next/link"

interface KanbanBoardProps {
  tasks: any[]
  project: any
  user: any
}

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "To Do", color: "bg-blue-100" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "in_review", title: "In Review", color: "bg-purple-100" },
  { id: "testing", title: "Testing", color: "bg-orange-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export function KanbanBoard({ tasks, project, user }: KanbanBoardProps) {
  const [taskList, setTaskList] = useState(tasks)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [statusColors, setStatusColors] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchStatusColors()
  }, [])

  const fetchStatusColors = async () => {
    try {
      const response = await fetch("/api/status-colors?type=task")
      if (response.ok) {
        const colors = await response.json()
        const colorMap = colors.reduce((acc: any, color: any) => {
          acc[color.status_value] = color
          return acc
        }, {})
        setStatusColors(colorMap)
      }
    } catch (error) {
      console.error("Error fetching status colors:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getColumnColor = (status: string) => {
    const statusColor = statusColors[status]
    if (statusColor) {
      return statusColor.bg_color.replace("text-", "bg-").replace("800", "100")
    }
    return COLUMNS.find((col) => col.id === status)?.color || "bg-gray-100"
  }

  const getTasksByStatus = (status: string) => {
    return taskList.filter((task) => task.status === status)
  }

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", taskId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const taskId = Number.parseInt(e.dataTransfer.getData("text/plain"))

    // Update local state immediately
    setTaskList((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))

    // Update in database
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (error) {
      console.error("Failed to update task status:", error)
      // Revert on error
      setTaskList((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: task.status } : task)))
    }
  }

  const handleTaskClick = (taskId: number) => {
    setSelectedTaskId(taskId)
    setTaskDetailOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/projects" className="text-blue-600 hover:text-blue-800">
                ← Projects
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.project_code} - Kanban Board</p>
                {project.client_name && <p className="text-xs text-gray-500">Client: {project.client_name}</p>}
              </div>
            </div>
            <CreateTaskDialog projectId={project.id} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${getColumnColor(column.id)} rounded-lg p-4 mb-4`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">{column.title}</h3>
                  <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
                </div>
              </div>

              <div className="space-y-3 min-h-96">
                {getTasksByStatus(column.id).map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      <div className="space-y-2">
                        {task.assigned_user_name && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-xs">{task.assigned_user_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {task.assigned_user_name}
                          </div>
                        )}

                        {task.due_date && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}

                        {task.estimated_hours && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimated_hours}h estimated
                          </div>
                        )}
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {JSON.parse(task.tags).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <EnhancedTaskDetailDialog taskId={selectedTaskId} open={taskDetailOpen} onOpenChange={setTaskDetailOpen} />
    </div>
  )
}
