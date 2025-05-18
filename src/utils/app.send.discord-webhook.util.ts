import axios from 'axios';

interface WebhookPayload {
  title: string;
  description: string;
  color: number;
}

export async function sendDiscordWebhook({
  title,
  description,
  color,
}: WebhookPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  await axios.post(webhookUrl, {
    embeds: [
      {
        title,
        description,
        color,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
