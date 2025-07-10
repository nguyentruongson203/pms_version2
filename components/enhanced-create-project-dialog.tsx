"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  name: string
  email: string
  role: string
}

export function EnhancedCreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([])
  const router = useRouter()

  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    description: "",
    project_code: "",

    // Timeline & Budget
    start_date: "",
    end_date: "",
    budget: "",
    estimated_budget: "",

    // Classification
    priority: "medium",
    type: "development",
    risk_level: "low",
    methodology: "agile",

    // Client Info
    client_name: "",
    client_email: "",

    // Team
    project_manager_id: "",

    // Integration
    repository_url: "",
    documentation_url: "",
    slack_channel: "",
    jira_project_key: "",
  })

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const customFieldsObj = customFields.reduce(
        (acc, field) => {
          if (field.key && field.value) {
            acc[field.key] = field.value
          }
          return acc
        },
        {} as Record<string, string>,
      )

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? Number.parseFloat(formData.budget) : null,
          estimated_budget: formData.estimated_budget ? Number.parseFloat(formData.estimated_budget) : null,
          project_manager_id: formData.project_manager_id ? Number.parseInt(formData.project_manager_id) : null,
          custom_fields: Object.keys(customFieldsObj).length > 0 ? customFieldsObj : null,
        }),
      })

      if (response.ok) {
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        console.error("Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      project_code: "",
      start_date: "",
      end_date: "",
      budget: "",
      estimated_budget: "",
      priority: "medium",
      type: "development",
      risk_level: "low",
      methodology: "agile",
      client_name: "",
      client_email: "",
      project_manager_id: "",
      repository_url: "",
      documentation_url: "",
      slack_channel: "",
      jira_project_key: "",
    })
    setCustomFields([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="timeline">Timeline & Budget</TabsTrigger>
              <TabsTrigger value="client">Client & Team</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="custom">Custom Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
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
                  <Label htmlFor="project_code">Project Code</Label>
                  <Input
                    id="project_code"
                    value={formData.project_code}
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
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
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_budget">Estimated Budget ($)</Label>
                  <Input
                    id="estimated_budget"
                    type="number"
                    step="0.01"
                    value={formData.estimated_budget}
                    onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Approved Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="client" className="space-y-4">
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

              <div>
                <Label htmlFor="project_manager_id">Project Manager</Label>
                <Select
                  value={formData.project_manager_id}
                  onValueChange={(value) => setFormData({ ...formData, project_manager_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => ["admin", "project_manager", "team_lead"].includes(user.role))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repository_url">Repository URL</Label>
                  <Input
                    id="repository_url"
                    value={formData.repository_url}
                    onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="documentation_url">Documentation URL</Label>
                  <Input
                    id="documentation_url"
                    value={formData.documentation_url}
                    onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                    placeholder="https://docs...."
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
                    onChange={(e) => setFormData({ ...formData, jira_project_key: e.target.value })}
                    placeholder="PROJ"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Custom Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-center">
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
                {customFields.length === 0 && <p className="text-gray-500 text-sm">No custom fields added</p>}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
