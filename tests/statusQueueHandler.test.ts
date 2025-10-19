// tests/statusQueueHandler.test.ts
describe("StatusQueueHandler", () => {
  const mockUpdateStatus = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("✅ procesa mensajes desde SQS y llama a updateStatus con datos correctos", async () => {
    // ✅ Carga el módulo dentro de isolateModules para aplicar los mocks antes de importar
    let main: any;

    jest.isolateModules(() => {
      jest.doMock("../src/domain/services/AppointmentService", () => ({
        AppointmentService: jest.fn().mockImplementation(() => ({
          updateStatus: mockUpdateStatus,
        })),
      }));

      jest.doMock("../src/infrastructure/dynamo/DynamoAppointmentRepository", () => ({
        DynamoAppointmentRepository: jest.fn().mockImplementation(() => ({})),
      }));

      jest.doMock("../src/infrastructure/sns/SNSPublisher", () => ({
        SNSPublisher: jest.fn().mockImplementation(() => ({})),
      }));

      // ✅ Importa después de los mocks
      main = require("../src/infrastructure/sqs/StatusQueueHandler").main;
    });

    // 🧪 Evento simulado SQS
    const event = {
      Records: [
        { body: JSON.stringify({ insuredId: "PE001", scheduleId: 10 }) },
        { body: JSON.stringify({ insuredId: "CL001", scheduleId: 20 }) },
      ],
    };

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await main(event);

    // ✅ Verificaciones
    expect(mockUpdateStatus).toHaveBeenCalledTimes(2);
    expect(mockUpdateStatus).toHaveBeenCalledWith("PE001", 10, "completed");
    expect(mockUpdateStatus).toHaveBeenCalledWith("CL001", 20, "completed");

    expect(consoleSpy).toHaveBeenCalledWith(
      "📨 Actualizando estado:",
      expect.objectContaining({ insuredId: "PE001" })
    );

    consoleSpy.mockRestore();
  });
});
