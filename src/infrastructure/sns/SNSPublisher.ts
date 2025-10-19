import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { Appointment } from "../../domain/models/Appointment";

export class SNSPublisher {
  private sns = new SNSClient({ region: process.env.AWS_REGION });
  private topicArn = process.env.SNS_TOPIC_ARN!;

  async publish(appointment: Appointment): Promise<void> {
    await this.sns.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(appointment),
      })
    );
    console.log("✅ Publicado en SNS:", appointment);
  }
}
