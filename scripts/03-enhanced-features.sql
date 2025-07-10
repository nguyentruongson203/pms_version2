-- Add more fields to projects table
ALTER TABLE projects 
ADD COLUMN client_name VARCHAR(255),
ADD COLUMN client_email VARCHAR(255),
ADD COLUMN project_manager_id INT,
ADD COLUMN estimated_budget DECIMAL(15,2),
ADD COLUMN actual_budget DECIMAL(15,2),
ADD COLUMN completion_percentage INT DEFAULT 0,
ADD COLUMN risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN methodology ENUM('agile', 'waterfall', 'scrum', 'kanban') DEFAULT 'agile',
ADD COLUMN repository_url VARCHAR(500),
ADD COLUMN documentation_url VARCHAR(500),
ADD COLUMN slack_channel VARCHAR(100),
ADD COLUMN jira_project_key VARCHAR(50),
ADD COLUMN custom_fields JSON,
ADD INDEX idx_project_manager (project_manager_id),
ADD FOREIGN KEY (project_manager_id) REFERENCES users(id);

-- Add status colors table
CREATE TABLE IF NOT EXISTS status_colors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  status_type ENUM('project', 'task') NOT NULL,
  status_value VARCHAR(50) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  bg_color VARCHAR(50) NOT NULL,
  text_color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_status (status_type, status_value)
);

-- Insert default status colors
INSERT INTO status_colors (status_type, status_value, color_hex, bg_color, text_color) VALUES
-- Project status colors
('project', 'planning', '#3B82F6', 'bg-blue-100', 'text-blue-800'),
('project', 'in_progress', '#F59E0B', 'bg-yellow-100', 'text-yellow-800'),
('project', 'on_hold', '#6B7280', 'bg-gray-100', 'text-gray-800'),
('project', 'under_review', '#8B5CF6', 'bg-purple-100', 'text-purple-800'),
('project', 'completed', '#10B981', 'bg-green-100', 'text-green-800'),
('project', 'cancelled', '#EF4444', 'bg-red-100', 'text-red-800'),

-- Task status colors
('task', 'backlog', '#6B7280', 'bg-gray-100', 'text-gray-800'),
('task', 'todo', '#3B82F6', 'bg-blue-100', 'text-blue-800'),
('task', 'in_progress', '#F59E0B', 'bg-yellow-100', 'text-yellow-800'),
('task', 'in_review', '#8B5CF6', 'bg-purple-100', 'text-purple-800'),
('task', 'testing', '#F97316', 'bg-orange-100', 'text-orange-800'),
('task', 'done', '#10B981', 'bg-green-100', 'text-green-800'),
('task', 'blocked', '#EF4444', 'bg-red-100', 'text-red-800');

-- Add reply functionality to comments
ALTER TABLE comments 
ADD COLUMN parent_comment_id INT,
ADD COLUMN mentioned_users JSON,
ADD INDEX idx_parent_comment (parent_comment_id),
ADD FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Enhanced activity logs
ALTER TABLE activity_logs 
ADD COLUMN affected_user_id INT,
ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN metadata JSON,
ADD INDEX idx_affected_user (affected_user_id),
ADD FOREIGN KEY (affected_user_id) REFERENCES users(id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  project_id INT,
  task_id INT,
  comment_id INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  INDEX idx_user_notifications (user_id, is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_name VARCHAR(100),
  template_data JSON,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status_scheduled (status, scheduled_at),
  INDEX idx_created_at (created_at)
);
