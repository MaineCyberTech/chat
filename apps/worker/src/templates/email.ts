// Professional HTML email templates for notification types

function wrapLayout(bodyHtml: string, footerText?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:24px auto;">
  <tr><td style="padding:24px 32px;background:#f5f5f5;border-radius:8px 8px 0 0;border-bottom:3px solid #4f46e5;">
    <h1 style="margin:0;font-size:18px;color:#1a1a2e;">MaineCyberTech Chat</h1>
  </td></tr>
  <tr><td style="padding:24px 32px;background:#ffffff;border-radius:0 0 8px 8px;">
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:12px 32px;font-size:12px;color:#888;text-align:center;">
    <p style="margin:0;">${footerText ?? "Sent from MaineCyberTech Chat"}</p>
  </td></tr>
</table>
</body>
</html>`;
}

function button(link: string, text: string): string {
  return `<a href="${link}" style="display:inline-block;padding:10px 24px;margin-top:16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${text}</a>`;
}

export function notificationTemplate(title: string, message: string, link?: string): string {
  const body = `
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a1a2e;">${title}</h2>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#333;">${message}</p>
    ${link ? button(link, "View in Chat") : ""}
  `;
  return wrapLayout(body);
}

export interface MentionData {
  channelName: string;
  mentionedBy: string;
  messagePreview: string;
  channelLink: string;
}

export function mentionTemplate(data: MentionData): string {
  const body = `
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a1a2e;">You were mentioned</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#666;">
      <strong>${data.mentionedBy}</strong> mentioned you in <strong>#${data.channelName}</strong>
    </p>
    <blockquote style="margin:12px 0;padding:12px 16px;background:#f9f9fb;border-left:3px solid #4f46e5;border-radius:4px;font-size:14px;color:#333;">
      ${data.messagePreview}
    </blockquote>
    ${button(data.channelLink, "View Conversation")}
  `;
  return wrapLayout(body);
}

export interface DigestData {
  date: string;
  channels: { name: string; messageCount: number; lastMessage: string }[];
  mentions: { user: string; text: string; link: string }[];
  unsubLink: string;
}

export function digestTemplate(data: DigestData): string {
  const channelRows = data.channels
    .map(
      (ch) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">#${ch.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#666;text-align:center;">${ch.messageCount}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;">${ch.lastMessage}</td>
      </tr>`,
    )
    .join("");

  const mentionItems = data.mentions
    .map(
      (m) => `<li style="margin:4px 0;font-size:14px;">
        <strong>${m.user}</strong>: ${m.text}
        ${m.link ? `<a href="${m.link}" style="color:#4f46e5;text-decoration:none;">View</a>` : ""}
      </li>`,
    )
    .join("");

  const body = `
    <h2 style="margin:0 0 8px;font-size:16px;color:#1a1a2e;">Your Daily Digest</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#666;">${data.date}</p>

    ${
      data.mentions.length > 0
        ? `
      <h3 style="margin:16px 0 8px;font-size:14px;color:#1a1a2e;">🔔 Mentions</h3>
      <ul style="margin:0;padding-left:20px;">
        ${mentionItems}
      </ul>
    `
        : ""
    }

    <h3 style="margin:16px 0 8px;font-size:14px;color:#1a1a2e;">📊 Channel Activity</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
      <tr style="background:#f9f9fb;">
        <th style="padding:8px;text-align:left;font-weight:600;">Channel</th>
        <th style="padding:8px;text-align:center;font-weight:600;">New</th>
        <th style="padding:8px;text-align:left;font-weight:600;">Latest</th>
      </tr>
      ${channelRows || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#888;font-size:14px;">No activity in the last 24h</td></tr>'}
    </table>

    <p style="margin-top:24px;font-size:12px;color:#888;">
      <a href="${data.unsubLink}" style="color:#888;">Unsubscribe from daily digest</a>
    </p>
  `;
  return wrapLayout(body, "MaineCyberTech Chat — Daily Digest");
}

export function dmTemplate(senderName: string, messagePreview: string, dmLink: string): string {
  const body = `
    <h2 style="margin:0 0 16px;font-size:16px;color:#1a1a2e;">Direct Message</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#666;">
      <strong>${senderName}</strong> sent you a message
    </p>
    <blockquote style="margin:12px 0;padding:12px 16px;background:#f9f9fb;border-left:3px solid #22c55e;border-radius:4px;font-size:14px;color:#333;">
      ${messagePreview}
    </blockquote>
    ${button(dmLink, "Reply")}
  `;
  return wrapLayout(body);
}
