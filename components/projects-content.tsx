"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Search, Users, Calendar, DollarSign } from "lucide-react"
import { EnhancedCreateProjectDialog } from "./enhanced-create-project-dialog"
import Link from "next/link"

interface ProjectsContentProps {
  projects: any[]
  user: any
}

export function ProjectsContent({ projects, user }: ProjectsContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusColors, setStatusColors] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchStatusColors()
  }, [])

  const fetchStatusColors = async () => {
    try {
      const response = await fetch("/api/status-colors?type=project")
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

  const getRiskLevelColor = (riskLevel: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }
    return colors[riskLevel as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesType = typeFilter === "all" || project.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            </div>
            <EnhancedCreateProjectDialog />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{project.project_code}</CardDescription>
                    {project.client_name && <p className="text-xs text-gray-500 mt-1">Client: {project.client_name}</p>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                    {project.risk_level && (
                      <Badge className={getRiskLevelColor(project.risk_level)} variant="outline">
                        {project.risk_level} risk
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description || "No description available"}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                    <Badge variant="outline">{project.type}</Badge>
                  </div>

                  {project.methodology && (
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Methodology: {project.methodology}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {project.member_count} members
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {project.task_count} tasks
                    </div>
                  </div>

                  {(project.budget || project.estimated_budget) && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      {project.estimated_budget && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Est: ${project.estimated_budget.toLocaleString()}
                        </div>
                      )}
                      {project.budget && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Budget: ${project.budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.completion_percentage || 0}%</span>
                    </div>
                    <Progress value={project.completion_percentage || 0} className="h-2" />
                  </div>

                  {project.end_date && (
                    <div className="text-sm text-gray-600">Due: {new Date(project.end_date).toLocaleDateString()}</div>
                  )}

                  {project.project_manager_name && (
                    <div className="text-sm text-gray-600">PM: {project.project_manager_name}</div>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      View
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/kanban`} className="flex-1">
                    <Button className="w-full">Kanban</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
