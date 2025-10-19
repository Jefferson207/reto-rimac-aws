import { Appointment } from "../models/Appointment";

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findByInsuredId(insuredId: string): Promise<Appointment[]>;
  updateStatus(insuredId: string, scheduleId: number, status: string): Promise<void>;
}
