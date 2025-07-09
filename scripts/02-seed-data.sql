-- Seed data for PMS system
USE pms_system;

-- Insert sample users
INSERT INTO users (email, name, role) VALUES
('admin@company.com', 'System Admin', 'admin'),
('pm1@company.com', 'Project Manager 1', 'project_manager'),
('lead1@company.com', 'Team Lead 1', 'team_lead'),
('dev1@company.com', 'Developer 1', 'member'),
('dev2@company.com', 'Developer 2', 'member'),
('designer1@company.com', 'Designer 1', 'member');

-- Insert sample projects
INSERT INTO projects (name, description, project_code, start_date, end_date, budget, priority, type, status, created_by) VALUES
('E-commerce Website', 'Build a modern e-commerce platform with React and Node.js', 'ECOM-001', '2024-01-15', '2024-06-30', 50000.00, 'high', 'development', 'in_progress', 2),
('Marketing Campaign Q1', 'Digital marketing campaign for Q1 2024', 'MARK-001', '2024-01-01', '2024-03-31', 25000.00, 'medium', 'marketing', 'planning', 2),
('Mobile App Development', 'iOS and Android mobile application', 'MOB-001', '2024-02-01', '2024-08-31', 75000.00, 'high', 'development', 'planning', 2);

-- Insert project members
INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 2, 'project_manager'),
(1, 3, 'team_lead'),
(1, 4, 'member'),
(1, 5, 'member'),
(1, 6, 'member'),
(2, 2, 'project_manager'),
(2, 6, 'member'),
(3, 2, 'project_manager'),
(3, 3, 'team_lead'),
(3, 4, 'member'),
(3, 5, 'member');

-- Insert sample tasks
INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, status, due_date, estimated_hours) VALUES
('Setup project structure', 'Initialize React project with TypeScript and configure build tools', 1, 4, 2, 'high', 'done', '2024-01-20', 8.0),
('Design database schema', 'Create ERD and implement database tables', 1, 4, 2, 'high', 'done', '2024-01-25', 12.0),
('Implement user authentication', 'Setup JWT authentication with login/register functionality', 1, 5, 2, 'high', 'in_progress', '2024-02-05', 16.0),
('Create product catalog UI', 'Design and implement product listing and detail pages', 1, 6, 2, 'medium', 'todo', '2024-02-15', 20.0),
('Setup payment integration', 'Integrate Stripe payment processing', 1, 4, 2, 'high', 'backlog', '2024-03-01', 24.0),
('Market research', 'Conduct competitor analysis and target audience research', 2, 6, 2, 'high', 'in_progress', '2024-01-30', 40.0),
('Create campaign assets', 'Design banners, social media posts, and landing pages', 2, 6, 2, 'medium', 'todo', '2024-02-15', 32.0);

-- Insert sample time entries
INSERT INTO time_entries (task_id, user_id, description, hours, date) VALUES
(1, 4, 'Project setup and configuration', 8.0, '2024-01-18'),
(2, 4, 'Database design and implementation', 12.0, '2024-01-22'),
(3, 5, 'JWT implementation and testing', 6.0, '2024-01-28'),
(6, 6, 'Competitor analysis research', 8.0, '2024-01-25');

-- Insert sample comments
INSERT INTO comments (task_id, user_id, content) VALUES
(3, 2, 'Please make sure to implement password reset functionality as well.'),
(3, 5, 'Working on it. Should be ready by end of week.'),
(6, 2, 'Great progress on the research. Can you also include pricing analysis?'),
(6, 6, 'Sure, I will add pricing comparison in the next update.');
