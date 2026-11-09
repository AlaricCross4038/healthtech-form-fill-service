import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const appointmentRequest = z.object({
  patientName: z.string().min(1), appointmentDate: z.string().min(1), clinician: z.string().min(1),
  pdfBase64: z.string().min(1), bucket: z.string().min(1), archiveKey: z.string().min(1)
});
export type AppointmentRequest = z.infer<typeof appointmentRequest>;

export function notificationState(input: Pick<AppointmentRequest, "appointmentDate">, today = new Date()): "upcoming" | "past" {
  const appointment = new Date(input.appointmentDate);
  const appointmentDay = Date.UTC(appointment.getUTCFullYear(), appointment.getUTCMonth(), appointment.getUTCDate());
  const currentDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return appointmentDay >= currentDay ? "upcoming" : "past";
}

export async function fillAndArchive(raw: unknown, client = new InfraiClient()) {
  const input = appointmentRequest.parse(raw);
  const state = notificationState(input);
  await client.request("POST", "/v1/storage/bucket/create", { name: input.bucket });
  const filled = await client.request<{ data_base64: string }>("POST", "/v1/pdf/form/fill", {
    pdf: input.pdfBase64,
    fields: { patient_name: input.patientName, appointment_date: input.appointmentDate, clinician: input.clinician, notification_state: state },
    flatten: true
  });
  await client.request("PUT", `/v1/storage/object/put/${encodeURIComponent(input.bucket)}/${encodeURIComponent(input.archiveKey)}`, { data_base64: filled.data_base64 });
  return { state, archiveKey: input.archiveKey };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Provide an AppointmentRequest to fillAndArchive from your route or worker.");
}
