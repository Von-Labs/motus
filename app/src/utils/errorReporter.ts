const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1479867803535278130/SHsLxhyJdRXBxPGqXA1DG7SjZPhObFZr4PjBWKYuEpf6SO0x5bD8p-BJihT-m634130x';

export async function reportErrorToDiscord(
  error: string,
  context?: { wallet?: string | null; model?: string; source?: string }
) {
  const fields = [
    { name: 'Error', value: error.slice(0, 1024), inline: false },
  ];

  if (context?.source) {
    fields.push({ name: 'Source', value: context.source, inline: true });
  }
  if (context?.model) {
    fields.push({ name: 'Model', value: context.model, inline: true });
  }
  if (context?.wallet) {
    fields.push({ name: 'Wallet', value: context.wallet, inline: true });
  }

  const body = {
    embeds: [
      {
        title: 'App Error Report',
        color: 0xff4444,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'Motus App' },
      },
    ],
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to send error report');
  }
}
