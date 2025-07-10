"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { MarkdownEditor } from "./markdown-editor"

interface EnhancedCreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CustomField {
  key: string
  value: string
}

export function EnhancedCreateProjectDialog({ open, onOpenChange }: EnhancedCreateProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [users, setUsers] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    project_code: "",
    description: "",
    priority: "medium",
    status: "planning",
    start_date: null as Date | null,
    end_date: null as Date | null,
    budget: "",
    estimated_budget: "",
    client_name: "",
    client_email: "",
    project_manager_id: "",
    risk_level: "low",
    methodology: "agile",
    repository_url: "",
    documentation_url: "",
    slack_channel: "",
    jira_project_key: "",
    team_members: [] as string[],
  })

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

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }])
  }

  const updateCustomField = (index: number, field: "key" | "value", value: string) => {
    const updated = [...customFields]
    updated[index][field] = value
    setCustomFields(updated)
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const addTeamMember = (userId: string) => {
    if (!formData.team_members.includes(userId)) {
      setFormData({
        ...formData,
        team_members: [...formData.team_members, userId],
      })
    }
  }

  const removeTeamMember = (userId: string) => {
    setFormData({
      ...formData,
      team_members: formData.team_members.filter((id) => id !== userId),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? Number.parseFloat(formData.budget) : null,
        estimated_budget: formData.estimated_budget ? Number.parseFloat(formData.estimated_budget) : null,
        custom_fields: customFields.reduce(
          (acc, field) => {
            if (field.key && field.value) {
              acc[field.key] = field.value
            }
            return acc
          },
          {} as Record<string, string>,
        ),
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        const result = await response.json()
        onOpenChange(false)
        router.refresh()

        // Reset form
        setFormData({
          name: "",
          project_code: "",
          description: "",
          priority: "medium",
          status: "planning",
          start_date: null,
          end_date: null,
          budget: "",
          estimated_budget: "",
          client_name: "",
          client_email: "",
          project_manager_id: "",
          risk_level: "low",
          methodology: "agile",
          repository_url: "",
          documentation_url: "",
          slack_channel: "",
          jira_project_key: "",
          team_members: [],
        })
        setCustomFields([])
        setActiveTab("basic")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create project")
      }
    } catch (error) {
      console.error("Project creation error:", error)
      alert("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="timeline">Timeline & Budget</TabsTrigger>
              <TabsTrigger value="client">Client & Team</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="custom">Custom Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="project_code">Project Code *</Label>
                      <Input
                        id="project_code"
                        value={formData.project_code}
                        onChange={(e) => setFormData({ ...formData, project_code: e.target.value.toUpperCase() })}
                        placeholder="e.g., PROJ-001"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <MarkdownEditor
                      value={formData.description}
                      onChange={(value) => setFormData({ ...formData, description: value })}
                      placeholder="Describe your project goals, scope, and requirements..."
                      rows={8}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="risk_level">Risk Level</Label>
                      <Select
                        value={formData.risk_level}
                        onValueChange={(value) => setFormData({ ...formData, risk_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline & Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.start_date || undefined}
                            onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.end_date ? format(formData.end_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.end_date || undefined}
                            onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget">Actual Budget ($)</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimated_budget">Estimated Budget ($)</Label>
                      <Input
                        id="estimated_budget"
                        type="number"
                        step="0.01"
                        value={formData.estimated_budget}
                        onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="methodology">Methodology</Label>
                    <Select
                      value={formData.methodology}
                      onValueChange={(value) => setFormData({ ...formData, methodology: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agile">Agile</SelectItem>
                        <SelectItem value="waterfall">Waterfall</SelectItem>
                        <SelectItem value="scrum">Scrum</SelectItem>
                        <SelectItem value="kanban">Kanban</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_name">Client Name</Label>
                      <Input
                        id="client_name"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_email">Client Email</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project_manager_id">Project Manager</Label>
                    <Select
                      value={formData.project_manager_id}
                      onValueChange={(value) => setFormData({ ...formData, project_manager_id: value })}
                      onOpenChange={(open) => open && loadUsers()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Team Members</Label>
                    <Select onValueChange={addTeamMember} onOpenChange={(open) => open && loadUsers()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((user) => !formData.team_members.includes(user.id.toString()))
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {formData.team_members.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.team_members.map((userId) => {
                          const user = users.find((u) => u.id.toString() === userId)
                          return (
                            <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                              {user?.name || `User ${userId}`}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTeamMember(userId)} />
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="repository_url">Repository URL</Label>
                      <Input
                        id="repository_url"
                        type="url"
                        value={formData.repository_url}
                        onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="documentation_url">Documentation URL</Label>
                      <Input
                        id="documentation_url"
                        type="url"
                        value={formData.documentation_url}
                        onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                        placeholder="https://docs.example.com/..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slack_channel">Slack Channel</Label>
                      <Input
                        id="slack_channel"
                        value={formData.slack_channel}
                        onChange={(e) => setFormData({ ...formData, slack_channel: e.target.value })}
                        placeholder="#project-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jira_project_key">JIRA Project Key</Label>
                      <Input
                        id="jira_project_key"
                        value={formData.jira_project_key}
                        onChange={(e) => setFormData({ ...formData, jira_project_key: e.target.value.toUpperCase() })}
                        placeholder="PROJ"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Custom Fields
                    <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Field name"
                        value={field.key}
                        onChange={(e) => updateCustomField(index, "key", e.target.value)}
                      />
                      <Input
                        placeholder="Field value"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, "value", e.target.value)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeCustomField(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No custom fields added yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
