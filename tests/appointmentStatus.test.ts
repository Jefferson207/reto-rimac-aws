import { jest } from "@jest/globals";
import { SNSPublisher } from "../src/infrastructure/sns/SNSPublisher";
import { DynamoAppointmentRepository } from "../src/infrastructure/dynamo/DynamoAppointmentRepository";
import { AppointmentService } from "../src/domain/services/AppointmentService";

// Mock repos y publicadores
jest.mock("../src/infrastructure/dynamo/DynamoAppointmentRepository");
jest.mock("../src/infrastructure/sns/SNSPublisher");

describe("AppointmentService", () => {
  const repoMock =
    new DynamoAppointmentRepository() as jest.Mocked<DynamoAppointmentRepository>;
  const snsMock = new SNSPublisher() as jest.Mocked<SNSPublisher>;
  const service = new AppointmentService(repoMock, snsMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ crea una cita y la guarda correctamente", async () => {
    repoMock.save.mockResolvedValue(undefined);
    snsMock.publish.mockResolvedValue(undefined);

    const result = await service.create({
      insuredId: "PE001",
      scheduleId: 55,
      countryISO: "PE",
    });

    expect(result.insuredId).toBe("PE001");
    expect(repoMock.save).toHaveBeenCalledTimes(1);
    expect(snsMock.publish).toHaveBeenCalledTimes(1);
  });
});
