"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, User, MessageCircle, Send, Reply } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface TaskDetailDialogProps {
  taskId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Comment {
  id: number
  content: string
  user_name: string
  user_email: string
  created_at: string
  parent_comment_id?: number
  parent_content?: string
  parent_user_name?: string
  mentioned_users?: number[]
}

interface TaskDetail {
  task: any
  comments: Comment[]
  timeEntries: any[]
}

export function EnhancedTaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [statusColors, setStatusColors] = useState<Record<string, any>>({})
  const [users, setUsers] = useState<any[]>([])
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [userSuggestions, setUserSuggestions] = useState<any[]>([])
  const [mentionQuery, setMentionQuery] = useState("")

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetail()
      fetchStatusColors()
      fetchUsers()
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

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleCommentChange = (value: string) => {
    setNewComment(value)

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1)
      if (query.length > 0) {
        const filtered = users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()))
        setUserSuggestions(filtered)
        setMentionQuery(query)
        setShowUserSuggestions(true)
      } else {
        setShowUserSuggestions(false)
      }
    } else {
      setShowUserSuggestions(false)
    }
  }

  const insertMention = (user: any) => {
    const lastAtIndex = newComment.lastIndexOf("@")
    const beforeMention = newComment.substring(0, lastAtIndex)
    const afterMention = newComment.substring(lastAtIndex + mentionQuery.length + 1)
    setNewComment(`${beforeMention}@${user.name} ${afterMention}`)
    setShowUserSuggestions(false)
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
          parent_comment_id: replyingTo,
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
        setReplyingTo(null)
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusColor = statusColors[status]
    if (statusColor) {
      return `${statusColor.bg_color} ${statusColor.text_color}`
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

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex space-x-3 ${isReply ? "ml-8 mt-2" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">{comment.user_name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm">{comment.user_name}</span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.parent_comment_id && (
            <Badge variant="outline" className="text-xs">
              Reply to {comment.parent_user_name}
            </Badge>
          )}
        </div>

        {comment.parent_content && (
          <div className="bg-gray-50 border-l-2 border-gray-200 pl-3 py-1 mb-2 text-xs text-gray-600">
            <span className="font-medium">{comment.parent_user_name}:</span> {comment.parent_content.substring(0, 100)}
            ...
          </div>
        )}

        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {comment.content.split(/(@\w+)/g).map((part, index) => {
            if (part.startsWith("@")) {
              const username = part.substring(1)
              const user = users.find((u) => u.name === username)
              return user ? (
                <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded">
                  {part}
                </span>
              ) : (
                part
              )
            }
            return part
          })}
        </div>

        <Button variant="ghost" size="sm" className="mt-1 h-6 px-2 text-xs" onClick={() => setReplyingTo(comment.id)}>
          <Reply className="h-3 w-3 mr-1" />
          Reply
        </Button>
      </div>
    </div>
  )

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
                  <form onSubmit={handleSubmitComment} className="mb-4 relative">
                    {replyingTo && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-sm">
                        <span className="font-medium">Replying to comment</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-5 px-2"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Textarea
                          value={newComment}
                          onChange={(e) => handleCommentChange(e.target.value)}
                          placeholder="Add a comment... Use @username to mention someone"
                          className="flex-1"
                          rows={2}
                        />

                        {showUserSuggestions && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                            {userSuggestions.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2"
                                onClick={() => insertMention(user)}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">{user.name}</div>
                                  <div className="text-xs text-gray-500">{user.role}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button type="submit" disabled={submittingComment || !newComment.trim()} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {taskDetail.comments
                      .filter((comment) => !comment.parent_comment_id)
                      .map((comment) => (
                        <div key={comment.id}>
                          {renderComment(comment)}
                          {/* Render replies */}
                          {taskDetail.comments
                            .filter((reply) => reply.parent_comment_id === comment.id)
                            .map((reply) => renderComment(reply, true))}
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
