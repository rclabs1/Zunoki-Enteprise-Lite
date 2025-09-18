import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export interface InvitationEmailData {
  email: string;
  organizationName: string;
  inviterName?: string;
  role: string;
  invitationToken: string;
  expiresAt: string;
}

/**
 * Send organization invitation email using Resend
 */
export async function sendInvitationEmail(data: InvitationEmailData) {
  try {
    const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${data.invitationToken}`;

    // Format role for display
    const roleDisplay = data.role.charAt(0).toUpperCase() + data.role.slice(1);

    // Format expiration date
    const expirationDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { data: result, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Zunoki Enterprise <noreply@zunoki.com>',
      to: [data.email],
      subject: `You're invited to join ${data.organizationName}`,
      html: createInvitationEmailHTML(data, invitationUrl, roleDisplay, expirationDate),
      text: createInvitationEmailText(data, invitationUrl, roleDisplay, expirationDate),
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Invitation email sent successfully:', result?.id);
    return { success: true, messageId: result?.id };

  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    throw error;
  }
}

/**
 * Create HTML version of invitation email
 */
function createInvitationEmailHTML(
  data: InvitationEmailData,
  invitationUrl: string,
  roleDisplay: string,
  expirationDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${data.organizationName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: white;
          font-weight: bold;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .org-info {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .org-name {
          font-size: 20px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 8px;
        }
        .role-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .cta-button {
          display: inline-block;
          background: #10b981;
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          text-align: center;
        }
        .cta-button:hover {
          background: #059669;
        }
        .details {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }
        .details-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }
        .details-item {
          margin-bottom: 8px;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Z</div>
          <h1 class="title">You're Invited!</h1>
          <p class="subtitle">Join ${data.organizationName} on Zunoki Enterprise</p>
        </div>

        <div class="org-info">
          <div class="org-name">${data.organizationName}</div>
          <span class="role-badge">Role: ${roleDisplay}</span>
        </div>

        <p>Hello!</p>

        <p>You've been invited to join <strong>${data.organizationName}</strong> as a <strong>${roleDisplay}</strong>. ${data.inviterName ? `This invitation was sent by ${data.inviterName}.` : 'This invitation was sent by a team member.'}</p>

        ${data.role === 'viewer' ? `
        <div class="warning">
          <strong>Note:</strong> As a viewer, you'll have limited access to reports until the organization completes payment. You can view basic reports but full analytics require a paid subscription.
        </div>
        ` : ''}

        <div style="text-align: center;">
          <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
        </div>

        <div class="details">
          <div class="details-title">Invitation Details:</div>
          <div class="details-item"><strong>Organization:</strong> ${data.organizationName}</div>
          <div class="details-item"><strong>Your Role:</strong> ${roleDisplay}</div>
          <div class="details-item"><strong>Expires:</strong> ${expirationDate}</div>
          <div class="details-item"><strong>Your Email:</strong> ${data.email}</div>
        </div>

        <p><strong>What's Next?</strong></p>
        <ol>
          <li>Click the "Accept Invitation" button above</li>
          <li>Sign in with your email address (${data.email})</li>
          <li>Start collaborating with your team!</li>
        </ol>

        <p>If you don't have an account yet, you'll be prompted to create one using this email address.</p>

        <div class="footer">
          <p>This invitation will expire on ${expirationDate}.</p>
          <p>If you have any questions, please contact your team administrator.</p>
          <p>© 2024 Zunoki Enterprise. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create plain text version of invitation email
 */
function createInvitationEmailText(
  data: InvitationEmailData,
  invitationUrl: string,
  roleDisplay: string,
  expirationDate: string
): string {
  return `
You're invited to join ${data.organizationName}!

Hello!

You've been invited to join ${data.organizationName} as a ${roleDisplay}. ${data.inviterName ? `This invitation was sent by ${data.inviterName}.` : 'This invitation was sent by a team member.'}

${data.role === 'viewer' ? `
Note: As a viewer, you'll have limited access to reports until the organization completes payment. You can view basic reports but full analytics require a paid subscription.
` : ''}

ACCEPT YOUR INVITATION:
${invitationUrl}

INVITATION DETAILS:
- Organization: ${data.organizationName}
- Your Role: ${roleDisplay}
- Expires: ${expirationDate}
- Your Email: ${data.email}

WHAT'S NEXT?
1. Click the invitation link above
2. Sign in with your email address (${data.email})
3. Start collaborating with your team!

If you don't have an account yet, you'll be prompted to create one using this email address.

This invitation will expire on ${expirationDate}.

If you have any questions, please contact your team administrator.

© 2024 Zunoki Enterprise. All rights reserved.
  `.trim();
}