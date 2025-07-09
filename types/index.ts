export interface User {
  id: number
  email: string
  name: string
  role: "admin" | "project_manager" | "team_lead" | "member" | "viewer"
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  name: string
  description?: string
  project_code: string
  start_date?: string
  end_date?: string
  budget?: number
  priority: "high" | "medium" | "low"
  type: "development" | "marketing" | "research" | "other"
  status: "planning" | "in_progress" | "on_hold" | "under_review" | "completed" | "cancelled"
  created_by: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  project_id: number
  assigned_to?: number
  created_by: number
  parent_task_id?: number
  priority: "high" | "medium" | "low"
  status: "backlog" | "todo" | "in_progress" | "in_review" | "testing" | "done" | "blocked"
  start_date?: string
  due_date?: string
  estimated_hours?: number
  actual_hours: number
  tags?: string[]
  created_at: string
  updated_at: string
  assigned_user?: User
  project?: Project
}

export interface TimeEntry {
  id: number
  task_id: number
  user_id: number
  description?: string
  hours: number
  date: string
  created_at: string
  task?: Task
  user?: User
}

export interface Comment {
  id: number
  task_id?: number
  project_id?: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  user?: User
}
