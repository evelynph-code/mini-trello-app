const nodemailer = require('nodemailer')
const { env } = require('../config/env')

const isSmtpConfigured = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass)

const createTransport = () =>
  nodemailer.createTransport({
    auth: {
      pass: env.smtpPass,
      user: env.smtpUser,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    family: 4,
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    socketTimeout: 15000,
  })

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const sendVerificationEmail = async (user, code) => {
  const name = escapeHtml(user.name)

  if (!isSmtpConfigured()) {
    console.info(
      `Email verification SMTP is not configured. Verification code for ${user.email}: ${code}`,
    )

    return { skipped: true }
  }

  const transporter = createTransport()

  await transporter.sendMail({
    from: env.appEmailFrom,
    html: `
      <p>Hi ${name},</p>
      <p>Use this code to confirm your email address for ${env.appName}:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 15 minutes.</p>
    `,
    subject: `Verify your ${env.appName} email`,
    text: [
      `Hi ${user.name},`,
      '',
      `Use this code to confirm your email address for ${env.appName}:`,
      code,
      '',
      'This code expires in 15 minutes.',
    ].join('\n'),
    to: user.email,
  })

  return { skipped: false }
}

module.exports = {
  sendVerificationEmail,
}
