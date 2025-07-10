import nodemailer from "nodemailer"
import { db } from "./db"

// Create transporter for Gmail
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
}

export async function queueEmail(options: EmailOptions) {
  try {
    await db.execute(
      `
      INSERT INTO email_queue (to_email, to_name, subject, html_body, text_body)
      VALUES (?, ?, ?, ?, ?)
    `,
      [options.to, options.toName, options.subject, options.html, options.text],
    )
  } catch (error) {
    console.error("Error queueing email:", error)
  }
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error.message }
  }
}

// Email templates
export const emailTemplates = {
  projectAssignment: (projectName: string, assigneeName: string, managerName: string) => ({
    subject: `You've been assigned to project: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Assignment</h2>
        <p>Hi ${assigneeName},</p>
        <p>You have been assigned to the project <strong>${projectName}</strong> by ${managerName}.</p>
        <p>Please log in to the Project Management System to view project details and start working on your tasks.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.APP_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
        </div>
        <p>Best regards,<br>Project Management Team</p>
      </div>
    `,
    text: `Hi ${assigneeName}, You have been assigned to the project "${projectName}" by ${managerName}. Please log in to view details.`,
  }),

  taskAssignment: (taskTitle: string, projectName: string, assigneeName: string, assignerName: string) => ({
    subject: `New task assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Task Assignment</h2>
        <p>Hi ${assigneeName},</p>
        <p>You have been assigned a new task:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; color: #495057;">${taskTitle}</h3>
          <p style="margin: 0; color: #6c757d;">Project: ${projectName}</p>
          <p style="margin: 5px 0 0 0; color: #6c757d;">Assigned by: ${assignerName}</p>
        </div>
        <div style="margin: 20px 0;">
          <a href="${process.env.APP_URL}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
        </div>
        <p>Best regards,<br>Project Management Team</p>
      </div>
    `,
    text: `Hi ${assigneeName}, You have been assigned a new task "${taskTitle}" in project "${projectName}" by ${assignerName}.`,
  }),

  commentMention: (
    commenterName: string,
    taskTitle: string,
    projectName: string,
    mentionedName: string,
    comment: string,
  ) => ({
    subject: `You were mentioned in a comment on ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You were mentioned</h2>
        <p>Hi ${mentionedName},</p>
        <p>${commenterName} mentioned you in a comment:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4 style="margin: 0 0 10px 0; color: #495057;">${taskTitle}</h4>
          <p style="margin: 0 0 10px 0; color: #6c757d;">Project: ${projectName}</p>
          <div style="border-left: 3px solid #007bff; padding-left: 15px;">
            <p style="margin: 0; font-style: italic;">${comment}</p>
          </div>
        </div>
        <div style="margin: 20px 0;">
          <a href="${process.env.APP_URL}" style="background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Comment</a>
        </div>
        <p>Best regards,<br>Project Management Team</p>
      </div>
    `,
    text: `Hi ${mentionedName}, ${commenterName} mentioned you in a comment on "${taskTitle}" in project "${projectName}": ${comment}`,
  }),
}

// Process email queue
export async function processEmailQueue() {
  try {
    const [emails] = await db.execute(`
      SELECT * FROM email_queue 
      WHERE status = 'pending' AND attempts < max_attempts
      ORDER BY created_at ASC
      LIMIT 10
    `)

    for (const email of emails as any[]) {
      const result = await sendEmail({
        to: email.to_email,
        toName: email.to_name,
        subject: email.subject,
        html: email.html_body,
        text: email.text_body,
      })

      if (result.success) {
        await db.execute(
          `
          UPDATE email_queue 
          SET status = 'sent', sent_at = NOW() 
          WHERE id = ?
        `,
          [email.id],
        )
      } else {
        await db.execute(
          `
          UPDATE email_queue 
          SET attempts = attempts + 1, error_message = ? 
          WHERE id = ?
        `,
          [result.error, email.id],
        )

        // Mark as failed if max attempts reached
        if (email.attempts + 1 >= email.max_attempts) {
          await db.execute(
            `
            UPDATE email_queue 
            SET status = 'failed' 
            WHERE id = ?
          `,
            [email.id],
          )
        }
      }
    }
  } catch (error) {
    console.error("Error processing email queue:", error)
  }
}
