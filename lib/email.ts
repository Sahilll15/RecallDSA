import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendRevisionReminder(
  to: string,
  userName: string,
  problems: Array<{ title: string; id: string; difficulty?: string | null }>
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  
  const problemsList = problems
    .map(
      (p) =>
        `<li style="margin: 10px 0;">
          <a href="${appUrl}/problems/${p.id}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
            ${p.title}
          </a>
          ${p.difficulty ? `<span style="color: #64748b; font-size: 14px;"> (${p.difficulty})</span>` : ""}
        </li>`
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">DSA Trainer</h1>
          <p style="color: #e2e8f0; margin: 10px 0 0 0;">Your Daily Revision Reminder</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${userName || "there"},</p>
          
          <p style="font-size: 16px;">You have <strong>${problems.length}</strong> problem${problems.length > 1 ? "s" : ""} due for revision today:</p>
          
          <ul style="list-style: none; padding: 0; margin: 20px 0;">
            ${problemsList}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/revision" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Start Revising</a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            Keep up the great work! Consistent revision is the key to mastering DSA.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
          <p>DSA Trainer - Your Personal Revision Assistant</p>
        </div>
      </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"DSA Trainer" <no-reply@example.com>',
    to,
    subject: `🔔 ${problems.length} Problem${problems.length > 1 ? "s" : ""} Due for Revision`,
    html,
  })
}

