import { AppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { Appointment } from "../../domain/models/Appointment";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export class DynamoAppointmentRepository implements AppointmentRepository {
  private tableName = process.env.APPOINTMENT_TABLE!;
  private client: DynamoDBDocumentClient;

  constructor() {
    const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.client = DynamoDBDocumentClient.from(ddbClient);
  }

  async save(appointment: Appointment): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: appointment,
      })
    );
  }

  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "insuredId = :id",
        ExpressionAttributeValues: { ":id": insuredId },
      })
    );
    return result.Items as Appointment[] || [];
  }

  async updateStatus(
    insuredId: string,
    scheduleId: number,
    status: string
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          insuredId,
          scheduleId,
        },
        UpdateExpression: "SET #s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status },
      })
    );
  }
}
