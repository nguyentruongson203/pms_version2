"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, MessageSquare, Reply, AtSign, Send, Upload } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { MarkdownRenderer } from "./markdown-renderer"
import { FileUploadDialog } from "./file-upload-dialog"

interface EnhancedTaskDetailDialogProps {
  taskId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnhancedTaskDetailDialog({ taskId, open, onOpenChange }: EnhancedTaskDetailDialogProps) {
  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [fileUploadOpen, setFileUploadOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (taskId && open) {
      loadTaskDetails()
      loadComments()
      loadUsers()
    }
  }, [taskId, open])

  const loadTaskDetails = async () => {
    if (!taskId) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTask(data)
      }
    } catch (error) {
      console.error("Failed to load task details:", error)
    }
  }

  const loadComments = async () => {
    if (!taskId) return

    try {
      const response = await fetch(`/api/comments?task_id=${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Failed to load comments:", error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
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
        setMentionSuggestions(filtered.slice(0, 5))
        setMentionQuery(query)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (user: any) => {
    const lastAtIndex = newComment.lastIndexOf("@")
    const beforeMention = newComment.substring(0, lastAtIndex)
    const afterMention = newComment.substring(lastAtIndex + mentionQuery.length + 1)
    setNewComment(`${beforeMention}@${user.name} ${afterMention}`)
    setShowMentions(false)
  }

  const submitComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
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
        setNewComment("")
        setReplyingTo(null)
        loadComments()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add comment")
      }
    } catch (error) {
      console.error("Comment submission error:", error)
      alert("Failed to add comment")
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (status: string) => {
    if (!taskId) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadTaskDetails()
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

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

  const renderComment = (comment: any, isReply = false) => {
    const hasReplies = comments.filter((c) => c.parent_comment_id === comment.id).length > 0

    return (
      <div key={comment.id} className={`space-y-3 ${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}>
        <div className="flex items-start space-x-3">
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
                  <Reply className="h-3 w-3 mr-1" />
                  Reply to {comment.parent_user_name}
                </Badge>
              )}
            </div>
            <div className="text-sm">
              <MarkdownRenderer content={comment.content} />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(comment.id)} className="text-xs">
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {hasReplies && <span className="text-xs text-gray-500">{comment.reply_count} replies</span>}
            </div>
          </div>
        </div>

        {/* Render replies */}
        {comments.filter((c) => c.parent_comment_id === comment.id).map((reply) => renderComment(reply, true))}
      </div>
    )
  }

  if (!task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading task details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <span>{task.title}</span>
              <Badge className={getStatusColor(task.status, task.status_bg_color, task.status_text_color)}>
                {task.status.replace("_", " ")}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            </DialogTitle>
            <div className="flex space-x-2">
              <Select value={task.status} onValueChange={updateTaskStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setFileUploadOpen(true)}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.filter((c) => !c.parent_comment_id).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {task.description ? (
                      <MarkdownRenderer content={task.description} />
                    ) : (
                      <p className="text-gray-500">No description provided</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Task Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Assigned to</p>
                        <p className="text-sm font-medium">{task.assigned_user_name || "Unassigned"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm font-medium">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="text-sm">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
                      <p className="text-xs text-gray-500">by {task.created_by_name}</p>
                    </div>

                    {task.updated_at !== task.created_at && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Comments List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Comments</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.filter((c) => !c.parent_comment_id).length > 0 ? (
                  comments.filter((c) => !c.parent_comment_id).map((comment) => renderComment(comment))
                ) : (
                  <p className="text-gray-500 text-center py-8">No comments yet</p>
                )}
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{replyingTo ? "Reply to Comment" : "Add Comment"}</CardTitle>
                {replyingTo && (
                  <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)} className="w-fit">
                    Cancel Reply
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Textarea
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder="Write a comment... Use @username to mention someone"
                    rows={4}
                  />

                  {/* Mention Suggestions */}
                  {showMentions && mentionSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                      {mentionSuggestions.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => insertMention(user)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <AtSign className="h-3 w-3" />
                    <span>Use @username to mention team members</span>
                  </div>
                  <Button onClick={submitComment} disabled={loading || !newComment.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : replyingTo ? "Reply" : "Comment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <FileUploadDialog
          open={fileUploadOpen}
          onOpenChange={setFileUploadOpen}
          taskId={taskId}
          onUploadComplete={() => {
            loadTaskDetails()
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
