import { SQSEvent } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const statusQueueUrl = process.env.STATUS_QUEUE_URL!;

export const main = async (event: SQSEvent) => {
  const processed: any[] = [];

  console.log("📥 Evento recibido en appointmentPE:", JSON.stringify(event.Records, null, 2));

  for (const record of event.Records) {
    try {
      const snsEnvelope = JSON.parse(record.body);
      const message = JSON.parse(snsEnvelope.Message);

      console.log("🔎 [PE] Procesando mensaje:", message);
      processed.push(message);

      try {
        const response = await sqs.send(
          new SendMessageCommand({
            QueueUrl: statusQueueUrl,
            MessageBody: JSON.stringify({
              insuredId: message.insuredId,
              scheduleId: message.scheduleId,
            }),
          })
        );

        console.log(
          `📤 Mensaje enviado a event-status-queue (MessageId: ${response.MessageId}) para insuredId=${message.insuredId}`
        );
      } catch (err) {
        console.error("❌ Error enviando mensaje a event-status-queue:", err);
      }
    } catch (err) {
      console.error("❌ Error procesando registro PE:", err);
    }
  }

  console.log("✅ PE completado:", JSON.stringify(processed, null, 2));
};
