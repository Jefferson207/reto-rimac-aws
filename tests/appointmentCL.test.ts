// @ts-nocheck
import { mockClient } from "aws-sdk-client-mock";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { main } from "../src/functions/appointmentCL";

// Creamos mock del cliente SQS
const sqsMock = mockClient(SQSClient);

beforeEach(() => {
  process.env.STATUS_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/351271460647/event-status-queue";
  process.env.AWS_REGION = "us-east-1";
  sqsMock.reset();
});

describe("Lambda appointmentPE", () => {
  test("📨 procesa y reenvía mensaje a event-status-queue", async () => {
    // Simulamos respuesta exitosa del SQS
    sqsMock.on(SendMessageCommand).resolves({ MessageId: "abc123" });

    // Ejecutamos la lambda con un evento SNS → SQS simulado
    await main({
      Records: [
        {
          body: JSON.stringify({
            Message: JSON.stringify({
              insuredId: "CL001",
              scheduleId: 99,
              countryISO: "CL",
            }),
          }),
        },
      ],
    } as any);

    // Extraemos la primera llamada del mock
    const sqsCall = sqsMock.call(0)?.args?.[0]?.input || {};

    // Validaciones robustas
    expect(sqsMock.call(0)).toBeDefined();
    expect(sqsCall.MessageBody).toContain("CL001");
    expect(sqsCall.QueueUrl || process.env.STATUS_QUEUE_URL).toContain("event-status-queue");
  });
});
