import { SQSEvent } from "aws-lambda";
import { DynamoAppointmentRepository } from "../dynamo/DynamoAppointmentRepository";
import { AppointmentService } from "../../domain/services/AppointmentService";
import { SNSPublisher } from "../sns/SNSPublisher";

const repository = new DynamoAppointmentRepository();
const sns = new SNSPublisher();
const service = new AppointmentService(repository, sns);

export const main = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    console.log("📨 Actualizando estado:", message);
    await service.updateStatus(message.insuredId, message.scheduleId, "completed");
  }
};
