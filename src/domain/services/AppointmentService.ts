import { Appointment } from "../models/Appointment";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { SNSPublisher } from "../../infrastructure/sns/SNSPublisher";
import { v4 as uuidv4 } from "uuid";

export class AppointmentService {
  constructor(
    private repository: AppointmentRepository,
    private snsPublisher: SNSPublisher
  ) {}

  async create(data: { insuredId: string; scheduleId: number; countryISO: string }): Promise<Appointment> {
    const appointment: Appointment = {
      ...data,
      status: "pending",
      requestId: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    await this.repository.save(appointment);
    await this.snsPublisher.publish(appointment);

    return appointment;
  }

  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    return this.repository.findByInsuredId(insuredId);
  }

  async updateStatus(insuredId: string, scheduleId: number, status: string): Promise<void> {
    await this.repository.updateStatus(insuredId, scheduleId, status);
  }
}
