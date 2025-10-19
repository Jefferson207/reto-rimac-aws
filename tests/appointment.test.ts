import { AppointmentService } from "../src/domain/services/AppointmentService";
import { DynamoAppointmentRepository } from "../src/infrastructure/dynamo/DynamoAppointmentRepository";
import { SNSPublisher } from "../src/infrastructure/sns/SNSPublisher";

jest.mock("../src/infrastructure/dynamo/DynamoAppointmentRepository");
jest.mock("../src/infrastructure/sns/SNSPublisher");

describe("AppointmentService", () => {
  const repo = new DynamoAppointmentRepository() as jest.Mocked<DynamoAppointmentRepository>;
  const sns = new SNSPublisher() as jest.Mocked<SNSPublisher>;
  const service = new AppointmentService(repo, sns);

  beforeEach(() => jest.clearAllMocks());

  it("crea una cita y publica en SNS", async () => {
    repo.save.mockResolvedValueOnce();
    sns.publish.mockResolvedValueOnce();

    const result = await service.create({ insuredId: "PE001", scheduleId: 1, countryISO: "PE" });

    expect(result.status).toBe("pending");
    expect(repo.save).toHaveBeenCalled();
    expect(sns.publish).toHaveBeenCalled();
  });
});
