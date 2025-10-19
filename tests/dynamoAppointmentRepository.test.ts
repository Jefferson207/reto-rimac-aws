import {
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { DynamoAppointmentRepository } from "../src/infrastructure/dynamo/DynamoAppointmentRepository";

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn() },
  QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
  UpdateCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe("DynamoAppointmentRepository", () => {
  let sendMock: jest.Mock;
  let repo: DynamoAppointmentRepository;

  beforeEach(() => {
    sendMock = jest.fn();
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({
      send: sendMock,
    });

    process.env.APPOINTMENT_TABLE = "rimac-appointment-DESA-appointments";
    process.env.AWS_REGION = "us-east-1";

    repo = new DynamoAppointmentRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("✅ findByInsuredId llama al QueryCommand con los parámetros correctos", async () => {
    const fakeResponse = {
      Items: [
        {
          insuredId: "PE001",
          scheduleId: 100,
          status: "pending",
          countryISO: "PE",
        },
      ],
    };
    sendMock.mockResolvedValueOnce(fakeResponse);

    const result = await repo.findByInsuredId("PE001");

    expect(sendMock).toHaveBeenCalledTimes(1);

    // Obtenemos el argumento pasado al QueryCommand (mockeado)
    const queryArg = (require("@aws-sdk/lib-dynamodb").QueryCommand as jest.Mock).mock.calls[0][0];

    expect(queryArg).toEqual({
      TableName: "rimac-appointment-DESA-appointments",
      KeyConditionExpression: "insuredId = :id",
      ExpressionAttributeValues: { ":id": "PE001" },
    });

    expect(result).toEqual(fakeResponse.Items);
  });

  test("✅ updateStatus llama al UpdateCommand con los parámetros correctos", async () => {
    await repo.updateStatus("PE001", 100, "completed");

    expect(sendMock).toHaveBeenCalledTimes(1);

    // Obtenemos el argumento pasado al UpdateCommand (mockeado)
    const updateArg = (require("@aws-sdk/lib-dynamodb").UpdateCommand as jest.Mock).mock.calls[0][0];

    expect(updateArg).toEqual({
      TableName: "rimac-appointment-DESA-appointments",
      Key: {
        insuredId: "PE001",
        scheduleId: 100,
      },
      UpdateExpression: "SET #s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": "completed" },
    });
  });
});
