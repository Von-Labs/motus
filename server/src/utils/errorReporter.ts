const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

interface ErrorContext {
  source?: string;
  wallet?: string;
  endpoint?: string;
  model?: string;
  [key: string]: unknown;
}

export async function reportErrorToDiscord(
  error: string,
  context?: ErrorContext
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const fields = [
    { name: 'Error', value: error.slice(0, 1024), inline: false },
  ];

  if (context?.source) {
    fields.push({ name: 'Source', value: String(context.source), inline: true });
  }
  if (context?.endpoint) {
    fields.push({ name: 'Endpoint', value: String(context.endpoint), inline: true });
  }
  if (context?.model) {
    fields.push({ name: 'Model', value: String(context.model), inline: true });
  }
  if (context?.wallet) {
    fields.push({ name: 'Wallet', value: String(context.wallet), inline: true });
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: 'Server Error',
            color: 0xff4444,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: 'Motus Server' },
          },
        ],
      }),
    });
  } catch {
    // Silent fail — don't let error reporting break the app
  }
}
