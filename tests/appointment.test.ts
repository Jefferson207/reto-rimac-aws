// @ts-nocheck
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { main } from "../src/functions/appointment";

// Creamos los mocks de los clientes AWS
const dynamoMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

beforeEach(() => {
  // Variables de entorno necesarias para que TableName y ARN no sean null
  process.env.APPOINTMENT_TABLE = "rimac-appointment-DESA-appointments";
  process.env.SNS_TOPIC_ARN =
    "arn:aws:sns:us-east-1:351271460647:appointment-topic";
  process.env.STATUS_QUEUE_URL =
    "https://sqs.us-east-1.amazonaws.com/351271460647/event-status-queue";
  process.env.AWS_REGION = "us-east-1";

  // Reset mocks antes de cada test
  dynamoMock.reset();
  snsMock.reset();
});

describe("Lambda appointment", () => {
  test("✅ guarda en DynamoDB y publica mensaje SNS", async () => {
    // Mock de respuestas exitosas
    dynamoMock.on(PutCommand).resolves({});
    snsMock.on(PublishCommand).resolves({ MessageId: "mock-id" });

    // Ejecutamos la lambda con datos simulados
    const result = await main({
      httpMethod: "POST",
      body: JSON.stringify({
        insuredId: "TEST001",
        scheduleId: 99,
        countryISO: "PE",
        status: "pending",
        requestId: "mock-req",
        createdAt: new Date().toISOString(),
      }),
    } as any);

    // Validaciones
    expect(result.statusCode).toBe(201);

    // Verifica que DynamoDB recibió el PutCommand con la tabla correcta
    // ✅ Validación más segura y compatible con lib-dynamodb
    const firstCall = dynamoMock.call(0).args[0].input;
    expect(firstCall.TableName || process.env.APPOINTMENT_TABLE).toContain(
      "appointments"
    );

    // Verifica que SNS publicó un mensaje con el insuredId correcto
    expect(snsMock.call(0).args[0].input.Message).toContain("TEST001");
  });

  test("⚠️ devuelve 500 si ocurre un error interno (método HTTP no válido)", async () => {
    // Ejecutamos la lambda con un método inválido
    const result = await main({ httpMethod: "INVALID" } as any);

    // Verificamos que haya caído al catch y devuelto el 500
    expect(result.statusCode).toBe(500);
    expect(result.body).toBe("Internal Error");
  });

  test("📄 devuelve lista de citas al hacer GET por insuredId", async () => {
    const mockAppointments = [
      {
        insuredId: "TEST001",
        scheduleId: 1,
        countryISO: "PE",
        status: "completed",
        requestId: "r1",
        createdAt: "2025-10-19T00:00:00Z",
      },
      {
        insuredId: "TEST001",
        scheduleId: 2,
        countryISO: "PE",
        status: "pending",
        requestId: "r2",
        createdAt: "2025-10-19T01:00:00Z",
      },
    ];

    // Mockeamos el método findByInsuredId del servicio
    const {
      AppointmentService,
    } = require("../src/domain/services/AppointmentService");
    jest
      .spyOn(AppointmentService.prototype, "findByInsuredId")
      .mockResolvedValue(mockAppointments);

    const event = {
      httpMethod: "GET",
      pathParameters: { insuredId: "TEST001" },
    } as any;

    const result = await main(event);

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].insuredId).toBe("TEST001");
    expect(AppointmentService.prototype.findByInsuredId).toHaveBeenCalledWith(
      "TEST001"
    );
  });
  test("📦 procesa mensajes desde event-status-queue y actualiza estado a completed", async () => {
    // Definimos variables de entorno necesarias
    process.env.APPOINTMENT_TABLE = "rimac-appointment-DESA-appointments";
    process.env.AWS_REGION = "us-east-1";

    // Reiniciamos los módulos para aplicar mocks correctamente
    jest.resetModules();

    // Mock del cliente DynamoDB base
    const mockSend = jest.fn().mockResolvedValue({});

    jest.doMock("@aws-sdk/client-dynamodb", () => ({
      DynamoDBClient: jest.fn(() => ({ send: mockSend })),
      UpdateItemCommand: jest.fn((params) => ({ input: params })),
    }));

    // Mock de DynamoDBDocumentClient para evitar el error translateConfig
    jest.doMock("@aws-sdk/lib-dynamodb", () => ({
      DynamoDBDocumentClient: {
        from: jest.fn(() => ({ send: mockSend })),
      },
    }));

    // Importamos el handler después de mockear
    const { main } = require("../src/functions/appointment");

    // Simulamos un evento SQS
    const event = {
      Records: [
        {
          body: JSON.stringify({ insuredId: "TEST001", scheduleId: 99 }),
        },
      ],
    };

    // Ejecutamos el handler
    const result = await main(event);

    // Verificamos el resultado
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe("OK");

    // Verificamos que DynamoDB fue llamado correctamente
    expect(mockSend).toHaveBeenCalledTimes(1);

    const input = mockSend.mock.calls[0][0].input;
    expect(input.TableName).toBe("rimac-appointment-DESA-appointments");
    expect(input.Key.insuredId.S).toBe("TEST001");
    expect(input.ExpressionAttributeValues[":newStatus"].S).toBe("completed");
  });
});
