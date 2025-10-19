import { AppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { Appointment } from "../../domain/models/Appointment";
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

export class DynamoAppointmentRepository implements AppointmentRepository {
  private tableName = process.env.APPOINTMENT_TABLE!;
  private client = new DynamoDBClient({ region: process.env.AWS_REGION });

  async save(appointment: Appointment): Promise<void> {
    const item = {
      insuredId: { S: appointment.insuredId },
      scheduleId: { N: appointment.scheduleId.toString() },
      countryISO: { S: appointment.countryISO },
      status: { S: appointment.status },
      requestId: { S: appointment.requestId },
      createdAt: { S: appointment.createdAt },
    };
    await this.client.send(new PutItemCommand({ TableName: this.tableName, Item: item }));
  }

  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "insuredId = :id",
        ExpressionAttributeValues: { ":id": { S: insuredId } },
      })
    );
    return (result.Items || []).map((item) => ({
      insuredId: item.insuredId.S!,
      scheduleId: Number(item.scheduleId.N),
      countryISO: item.countryISO.S!,
      status: item.status.S!,
      requestId: item.requestId.S!,
      createdAt: item.createdAt.S!,
    }));
  }

  async updateStatus(insuredId: string, scheduleId: number, status: string): Promise<void> {
    await this.client.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: {
          insuredId: { S: insuredId },
          scheduleId: { N: scheduleId.toString() },
        },
        UpdateExpression: "SET #s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": { S: status } },
      })
    );
  }
}
