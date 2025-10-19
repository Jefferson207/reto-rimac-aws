import { SQSEvent } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const statusQueueUrl = process.env.STATUS_QUEUE_URL!;

export const main = async (event: SQSEvent) => {
  const processed: any[] = [];

  console.log("📥 Evento recibido en appointmentCL:", JSON.stringify(event.Records, null, 2));

  for (const record of event.Records) {
    try {
      const snsEnvelope = JSON.parse(record.body);
      const message = JSON.parse(snsEnvelope.Message);

      console.log("🔎 [CL] Procesando mensaje:", message);
      processed.push(message);

      // Enviar mensaje a la cola de estado (EventBridge simulado)
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
    } catch (error) {
      console.error("❌ Error procesando registro CL:", error);
    }
  }

  console.log("✅ CL completado:", JSON.stringify(processed, null, 2));
};
