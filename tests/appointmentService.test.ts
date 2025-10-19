import { AppointmentService } from "../src/domain/services/AppointmentService";

describe("AppointmentService", () => {
  const mockRepository = {
    findByInsuredId: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockSNS = {
    publish: jest.fn(),
  };

  const service = new AppointmentService(
    mockRepository as any,
    mockSNS as any
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ findByInsuredId llama al repositorio con el insuredId correcto", async () => {
    // Arrange
    const fakeAppointments = [
      { insuredId: "PE001", scheduleId: 10, status: "pending" },
    ];
    mockRepository.findByInsuredId.mockResolvedValue(fakeAppointments);

    // Act
    const result = await service.findByInsuredId("PE001");

    // Assert
    expect(mockRepository.findByInsuredId).toHaveBeenCalledWith("PE001");
    expect(result).toEqual(fakeAppointments);
  });

  test("✅ updateStatus llama al repositorio con insuredId, scheduleId y status correctos", async () => {
    // Act
    await service.updateStatus("PE001", 10, "completed");

    // Assert
    expect(mockRepository.updateStatus).toHaveBeenCalledWith(
      "PE001",
      10,
      "completed"
    );
  });
});
