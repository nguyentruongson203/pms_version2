-- Enhanced features for PMS system
-- Add status colors table
CREATE TABLE IF NOT EXISTS status_colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_type ENUM('task', 'project') NOT NULL,
  status_value VARCHAR(50) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  bg_color VARCHAR(20) NOT NULL,
  text_color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_status (status_type, status_value)
);

-- Insert default status colors
INSERT INTO status_colors (status_type, status_value, color_hex, bg_color, text_color) VALUES
('task', 'todo', '#6B7280', 'bg-gray-100', 'text-gray-800'),
('task', 'in_progress', '#3B82F6', 'bg-blue-100', 'text-blue-800'),
('task', 'review', '#F59E0B', 'bg-yellow-100', 'text-yellow-800'),
('task', 'done', '#10B981', 'bg-green-100', 'text-green-800'),
('project', 'planning', '#8B5CF6', 'bg-purple-100', 'text-purple-800'),
('project', 'active', '#3B82F6', 'bg-blue-100', 'text-blue-800'),
('project', 'on_hold', '#F59E0B', 'bg-yellow-100', 'text-yellow-800'),
('project', 'completed', '#10B981', 'bg-green-100', 'text-green-800'),
('project', 'cancelled', '#EF4444', 'bg-red-100', 'text-red-800');

-- Add file uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  project_id INT,
  task_id INT,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Add email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhance projects table with more fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS project_manager_id INT,
ADD COLUMN IF NOT EXISTS risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS methodology ENUM('agile', 'waterfall', 'scrum', 'kanban') DEFAULT 'agile',
ADD COLUMN IF NOT EXISTS repository_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS documentation_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS slack_channel VARCHAR(100),
ADD COLUMN IF NOT EXISTS jira_key VARCHAR(50),
ADD COLUMN IF NOT EXISTS custom_fields JSON,
ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add foreign key for project manager
ALTER TABLE projects 
ADD CONSTRAINT fk_project_manager 
FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Enhance comments table for replies and mentions
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_id INT,
ADD COLUMN IF NOT EXISTS mentioned_users JSON;

ALTER TABLE comments 
ADD CONSTRAINT fk_comment_parent 
FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Enhanced activity logs with more metadata
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS metadata JSON,
ADD COLUMN IF NOT EXISTS affected_users JSON,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;
