import nodemailer from "nodemailer"
import db from "./db"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Google App Password
  },
})

interface EmailData {
  to: string
  toName?: string
  subject: string
  template: string
  data: Record<string, any>
}

export async function sendNotificationEmail({ to, toName, subject, template, data }: EmailData) {
  try {
    const { html, text } = generateEmailContent(template, data)

    // Queue email in database
    await db.execute(
      `INSERT INTO email_queue (to_email, to_name, subject, html_content, text_content, template_name, template_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [to, toName, subject, html, text, template, JSON.stringify(data)],
    )

    // Try to send immediately (in production, use a queue worker)
    if (process.env.NODE_ENV === "production") {
      await processEmailQueue()
    }
  } catch (error) {
    console.error("Email notification error:", error)
  }
}

export async function processEmailQueue() {
  try {
    const [emails] = await db.execute(
      `SELECT * FROM email_queue 
       WHERE status = 'pending' AND attempts < max_attempts 
       ORDER BY scheduled_at ASC 
       LIMIT 10`,
    )

    for (const email of emails as any[]) {
      try {
        await transporter.sendMail({
          from: `"${process.env.FROM_NAME || "PMS System"}" <${process.env.FROM_EMAIL || "noreply@pms.com"}>`,
          to: email.to_name ? `"${email.to_name}" <${email.to_email}>` : email.to_email,
          subject: email.subject,
          html: email.html_content,
          text: email.text_content,
        })

        // Mark as sent
        await db.execute(`UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?`, [email.id])

        console.log(`Email sent successfully to ${email.to_email}`)
      } catch (error) {
        console.error(`Failed to send email to ${email.to_email}:`, error)

        // Mark as failed and increment attempts
        await db.execute(
          `UPDATE email_queue 
           SET attempts = attempts + 1, error_message = ?, status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END
           WHERE id = ?`,
          [error instanceof Error ? error.message : "Unknown error", email.id],
        )
      }
    }
  } catch (error) {
    console.error("Email queue processing error:", error)
  }
}

function generateEmailContent(template: string, data: Record<string, any>) {
  const templates = {
    mention: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You were mentioned in a comment</h2>
          <p>Hi there,</p>
          <p><strong>${data.mentionedBy}</strong> mentioned you in a comment:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0;">${data.content}</p>
          </div>
          ${data.taskTitle ? `<p><strong>Task:</strong> ${data.taskTitle}</p>` : ""}
          ${data.projectName ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ""}
          <p>
            <a href="${data.actionUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Comment
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from PMS System. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `You were mentioned in a comment by ${data.mentionedBy}:\n\n${data.content}\n\n${data.taskTitle ? `Task: ${data.taskTitle}\n` : ""}${data.projectName ? `Project: ${data.projectName}\n` : ""}\nView: ${data.actionUrl}`,
    },

    task_comment: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New comment on your task</h2>
          <p>Hi there,</p>
          <p><strong>${data.commenterName}</strong> commented on your task:</p>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">${data.taskTitle}</h3>
            <p style="margin: 0; color: #666;">Project: ${data.projectName}</p>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0;">${data.content}</p>
          </div>
          <p>
            <a href="${data.actionUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from PMS System. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `New comment on your task "${data.taskTitle}" by ${data.commenterName}:\n\n${data.content}\n\nProject: ${data.projectName}\nView: ${data.actionUrl}`,
    },

    task_assigned: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Task Assigned to You</h2>
          <p>Hi ${data.assigneeName},</p>
          <p>You have been assigned a new task:</p>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2e7d32;">${data.taskTitle}</h3>
            <p style="margin: 0; color: #666;">Project: ${data.projectName}</p>
            <p style="margin: 5px 0 0 0; color: #666;">Priority: ${data.priority}</p>
            ${data.dueDate ? `<p style="margin: 5px 0 0 0; color: #666;">Due: ${data.dueDate}</p>` : ""}
          </div>
          ${data.description ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;"><p style="margin: 0;">${data.description}</p></div>` : ""}
          <p>
            <a href="${data.actionUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from PMS System. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Task assigned to you: "${data.taskTitle}"\n\nProject: ${data.projectName}\nPriority: ${data.priority}\n${data.dueDate ? `Due: ${data.dueDate}\n` : ""}\n${data.description ? `Description: ${data.description}\n` : ""}\nView: ${data.actionUrl}`,
    },

    project_assigned: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Added to Project Team</h2>
          <p>Hi ${data.memberName},</p>
          <p>You have been added to a project team:</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">${data.projectName}</h3>
            <p style="margin: 0; color: #666;">Role: ${data.role}</p>
            <p style="margin: 5px 0 0 0; color: #666;">Project Manager: ${data.projectManager}</p>
          </div>
          ${data.description ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;"><p style="margin: 0;">${data.description}</p></div>` : ""}
          <p>
            <a href="${data.actionUrl}" style="background: #ffc107; color: #212529; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Project
            </a>
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from PMS System. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `You have been added to project "${data.projectName}"\n\nRole: ${data.role}\nProject Manager: ${data.projectManager}\n${data.description ? `Description: ${data.description}\n` : ""}\nView: ${data.actionUrl}`,
    },
  }

  const template_content = templates[template as keyof typeof templates]
  if (!template_content) {
    throw new Error(`Email template "${template}" not found`)
  }

  return template_content
}

// Cron job function to process email queue (call this periodically)
export async function startEmailProcessor() {
  setInterval(async () => {
    await processEmailQueue()
  }, 30000) // Process every 30 seconds
}
