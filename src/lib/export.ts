import { getConversationMessages, type Conversation } from '$lib/db/dexie';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function slugify(title: string): string {
  const base = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (base || 'conversation').toLowerCase();
}

/**
 * Build a Markdown document for a conversation.
 */
export async function buildConversationMarkdown(
  conv: Conversation,
): Promise<string> {
  const messages = await getConversationMessages(conv.id);

  const lines: string[] = [];
  lines.push(`# ${conv.title}`);
  lines.push('');
  lines.push(`- **Model:** \`${conv.modelId}\``);
  lines.push(`- **Created:** ${formatDate(conv.createdAt)}`);
  lines.push(`- **Messages:** ${messages.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of messages) {
    if (msg.role === 'system') {
      lines.push('### System');
    } else if (msg.role === 'user') {
      lines.push('### User');
    } else {
      lines.push('### Assistant');
      if (msg.modelId) {
        lines.push('');
        lines.push(`*Model: \`${msg.modelId}\`*`);
      }
    }
    lines.push('');
    lines.push(msg.content.trim());
    if (msg.reasoning) {
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Reasoning</summary>');
      lines.push('');
      lines.push(msg.reasoning.trim());
      lines.push('');
      lines.push('</details>');
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Download a conversation as a Markdown (.md) file.
 */
export async function downloadConversationAsMarkdown(conv: Conversation) {
  const markdown = await buildConversationMarkdown(conv);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(conv.title)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
