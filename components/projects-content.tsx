"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Search, Users, Calendar, DollarSign } from "lucide-react"
import { CreateProjectDialog } from "./create-project-dialog"
import Link from "next/link"

interface ProjectsContentProps {
  projects: any[]
  user: any
}

export function ProjectsContent({ projects, user }: ProjectsContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const getStatusColor = (status: string) => {
    const colors = {
      planning: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      under_review: "bg-purple-100 text-purple-800",
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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchTerm.toLowerCase())
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
            <CreateProjectDialog />
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
                  </div>
                  <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
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

                  {project.budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1" />${project.budget.toLocaleString()}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  {project.end_date && (
                    <div className="text-sm text-gray-600">Due: {new Date(project.end_date).toLocaleDateString()}</div>
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
