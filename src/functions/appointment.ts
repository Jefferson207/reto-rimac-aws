import { APIGatewayEvent, SQSEvent } from "aws-lambda";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoAppointmentRepository } from "../infrastructure/dynamo/DynamoAppointmentRepository";
import { AppointmentService } from "../domain/services/AppointmentService";
import { SNSPublisher } from "../infrastructure/sns/SNSPublisher";

const repo = new DynamoAppointmentRepository();
const sns = new SNSPublisher();
const service = new AppointmentService(repo, sns);
const client = new DynamoDBClient({});
const tableName = process.env.APPOINTMENT_TABLE!;

export const main = async (event: any) => {
  try {
    // --- CASO HTTP ---
    if (event.httpMethod) {
      if (event.httpMethod === "POST") {
        const body = JSON.parse(event.body || "{}");
        const result = await service.create(body);
        console.log("✅ Cita creada:", result);
        return { statusCode: 201, body: JSON.stringify(result) };
      } else if (event.httpMethod === "GET") {
        const insuredId = event.pathParameters?.insuredId!;
        const result = await service.findByInsuredId(insuredId);
        console.log("📄 Resultado GET:", result);
        return { statusCode: 200, body: JSON.stringify(result) };
      } else {
        throw new Error("Método HTTP no soportado");
      }
    }

    // --- CASO EVENTO SQS ---
    if (event.Records) {
      console.log(
        "📥 Mensaje recibido desde event-status-queue:",
        event.Records.length
      );
      for (const record of event.Records) {
        const body = JSON.parse(record.body);
        console.log("🔎 Procesando actualización:", body);

        await client.send(
          new UpdateItemCommand({
            TableName: tableName,
            Key: {
              insuredId: { S: body.insuredId },
              scheduleId: { N: String(body.scheduleId) },
            },
            UpdateExpression: "SET #st = :newStatus",
            ExpressionAttributeNames: { "#st": "status" },
            ExpressionAttributeValues: { ":newStatus": { S: "completed" } },
          })
        );

        console.log(
          `✅ Estado actualizado a "completed" para ${body.insuredId}`
        );
      }
    }

    return { statusCode: 200, body: "OK" };
  } catch (error) {
    console.error("❌ Error en appointment:", error);
    return { statusCode: 500, body: "Internal Error" };
  }
};
