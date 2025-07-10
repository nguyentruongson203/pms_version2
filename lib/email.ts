import nodemailer from "nodemailer"
import db from "./db"

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "localhost",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailData {
  to: string
  name: string
  subject: string
  template: string
  data: any
}

export async function sendNotificationEmail({ to, name, subject, template, data }: EmailData) {
  try {
    const htmlContent = generateEmailTemplate(template, { ...data, recipient_name: name })
    const textContent = generateTextContent(template, { ...data, recipient_name: name })

    // Queue email in database
    await db.execute(
      `INSERT INTO email_queue (to_email, to_name, subject, html_content, text_content, template_name, template_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [to, name, subject, htmlContent, textContent, template, JSON.stringify(data)],
    )

    // Try to send immediately (in production, use a queue worker)
    if (process.env.NODE_ENV === "production") {
      await processEmailQueue()
    }
  } catch (error) {
    console.error("Email queue error:", error)
  }
}

export async function processEmailQueue() {
  try {
    const [emails] = await db.execute(
      `SELECT * FROM email_queue 
       WHERE status = 'pending' AND attempts < max_attempts 
       AND scheduled_at <= NOW() 
       ORDER BY created_at ASC 
       LIMIT 10`,
    )

    for (const email of emails as any[]) {
      try {
        await transporter.sendMail({
          from: `"${process.env.FROM_NAME || "PMS System"}" <${process.env.FROM_EMAIL || "noreply@pms.com"}>`,
          to: `"${email.to_name}" <${email.to_email}>`,
          subject: email.subject,
          html: email.html_content,
          text: email.text_content,
        })

        // Mark as sent
        await db.execute(`UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?`, [email.id])

        console.log(`Email sent to ${email.to_email}`)
      } catch (error) {
        // Mark as failed and increment attempts
        await db.execute(
          `UPDATE email_queue 
           SET attempts = attempts + 1, error_message = ?, 
               status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END
           WHERE id = ?`,
          [error.message, email.id],
        )

        console.error(`Email failed for ${email.to_email}:`, error)
      }
    }
  } catch (error) {
    console.error("Email queue processing error:", error)
  }
}

function generateEmailTemplate(template: string, data: any): string {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background: #f9f9f9; }
      .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; }
      .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
  `

  switch (template) {
    case "project_assignment":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Project Assignment</h1>
            </div>
            <div class="content">
              <p>Hello ${data.recipient_name},</p>
              <p>You have been assigned as project manager for <strong>${data.project_name}</strong> (${data.project_code}).</p>
              <p>Assigned by: ${data.assigned_by}</p>
              <p><a href="${data.project_url}" class="button">View Project</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from PMS System</p>
            </div>
          </div>
        </body>
        </html>
      `

    case "task_assignment":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Task Assignment</h1>
            </div>
            <div class="content">
              <p>Hello ${data.recipient_name},</p>
              <p>A new task has been assigned to you:</p>
              <h3>${data.task_title}</h3>
              <p><strong>Project:</strong> ${data.project_name}</p>
              <p><strong>Priority:</strong> ${data.priority}</p>
              <p><strong>Due Date:</strong> ${data.due_date || "Not set"}</p>
              <p><a href="${data.task_url}" class="button">View Task</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from PMS System</p>
            </div>
          </div>
        </body>
        </html>
      `

    case "mention_notification":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You were mentioned</h1>
            </div>
            <div class="content">
              <p>Hello ${data.recipient_name},</p>
              <p><strong>${data.mentioned_by}</strong> mentioned you in a comment:</p>
              <blockquote style="border-left: 4px solid #3B82F6; padding-left: 16px; margin: 16px 0; font-style: italic;">
                ${data.comment_content}
              </blockquote>
              <p><a href="${data.comment_url}" class="button">View Comment</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from PMS System</p>
            </div>
          </div>
        </body>
        </html>
      `

    case "task_comment":
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Comment</h1>
            </div>
            <div class="content">
              <p>Hello ${data.recipient_name},</p>
              <p><strong>${data.commenter_name}</strong> commented on your task:</p>
              <h3>${data.task_title}</h3>
              <blockquote style="border-left: 4px solid #3B82F6; padding-left: 16px; margin: 16px 0; font-style: italic;">
                ${data.comment_content}
              </blockquote>
              <p><a href="${data.task_url}" class="button">View Task</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message from PMS System</p>
            </div>
          </div>
        </body>
        </html>
      `

    default:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="content">
              <p>Hello ${data.recipient_name},</p>
              <p>You have a new notification from PMS System.</p>
            </div>
          </div>
        </body>
        </html>
      `
  }
}

function generateTextContent(template: string, data: any): string {
  switch (template) {
    case "project_assignment":
      return `Hello ${data.recipient_name},\n\nYou have been assigned as project manager for ${data.project_name} (${data.project_code}).\n\nAssigned by: ${data.assigned_by}\n\nView project: ${data.project_url}`

    case "task_assignment":
      return `Hello ${data.recipient_name},\n\nA new task has been assigned to you:\n\n${data.task_title}\n\nProject: ${data.project_name}\nPriority: ${data.priority}\nDue Date: ${data.due_date || "Not set"}\n\nView task: ${data.task_url}`

    case "mention_notification":
      return `Hello ${data.recipient_name},\n\n${data.mentioned_by} mentioned you in a comment:\n\n"${data.comment_content}"\n\nView comment: ${data.comment_url}`

    case "task_comment":
      return `Hello ${data.recipient_name},\n\n${data.commenter_name} commented on your task: ${data.task_title}\n\n"${data.comment_content}"\n\nView task: ${data.task_url}`

    default:
      return `Hello ${data.recipient_name},\n\nYou have a new notification from PMS System.`
  }
}
