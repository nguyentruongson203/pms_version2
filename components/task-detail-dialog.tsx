"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, User, MessageCircle, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface TaskDetailDialogProps {
  taskId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TaskDetail {
  task: any
  comments: any[]
  timeEntries: any[]
}

export function TaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetail()
    }
  }, [open, taskId])

  const fetchTaskDetail = async () => {
    if (!taskId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTaskDetail(data)
      }
    } catch (error) {
      console.error("Error fetching task detail:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !taskId) return

    setSubmittingComment(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          task_id: taskId,
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setTaskDetail((prev) =>
          prev
            ? {
                ...prev,
                comments: [...prev.comments, comment],
              }
            : null,
        )
        setNewComment("")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
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

  const getStatusColor = (status: string) => {
    const colors = {
      backlog: "bg-gray-100 text-gray-800",
      todo: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      in_review: "bg-purple-100 text-purple-800",
      testing: "bg-orange-100 text-orange-800",
      done: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading task details...</div>
          </div>
        ) : taskDetail ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{taskDetail.task.title}</DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getPriorityColor(taskDetail.task.priority)}>{taskDetail.task.priority}</Badge>
                <Badge className={getStatusColor(taskDetail.task.status)}>
                  {taskDetail.task.status.replace("_", " ")}
                </Badge>
                <span className="text-sm text-gray-500">
                  {taskDetail.task.project_name} ({taskDetail.task.project_code})
                </span>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {taskDetail.task.description || "No description provided"}
                  </p>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comments ({taskDetail.comments.length})
                  </h3>

                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} className="mb-4">
                    <div className="flex space-x-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1"
                        rows={2}
                      />
                      <Button type="submit" disabled={submittingComment || !newComment.trim()} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {taskDetail.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{comment.user_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{comment.user_name}</span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {taskDetail.comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet</p>}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Task Info */}
                <div>
                  <h3 className="font-semibold mb-3">Task Information</h3>
                  <div className="space-y-3">
                    {taskDetail.task.assigned_user_name && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Assigned to: {taskDetail.task.assigned_user_name}</span>
                      </div>
                    )}

                    {taskDetail.task.due_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Due: {new Date(taskDetail.task.due_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {taskDetail.task.estimated_hours && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Estimated: {taskDetail.task.estimated_hours}h</span>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">Created by: {taskDetail.task.created_by_name}</div>

                    <div className="text-sm text-gray-500">
                      Created: {new Date(taskDetail.task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {taskDetail.task.tags && taskDetail.task.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(taskDetail.task.tags).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Tracking */}
                {taskDetail.timeEntries.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Time Entries</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {taskDetail.timeEntries.map((entry) => (
                        <div key={entry.id} className="text-sm border-l-2 border-blue-200 pl-2">
                          <div className="font-medium">{entry.hours}h</div>
                          <div className="text-gray-600">{entry.user_name}</div>
                          <div className="text-gray-500 text-xs">{new Date(entry.date).toLocaleDateString()}</div>
                          {entry.description && <div className="text-gray-600 text-xs mt-1">{entry.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">Task not found</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
