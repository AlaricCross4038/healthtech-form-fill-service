import assert from "node:assert/strict";
import { notificationState } from "./appointment_service.ts";

const today = new Date("2026-09-13T00:00:00Z");
assert.equal(notificationState({ appointmentDate: "2026-09-14T09:00:00Z" }, today), "upcoming");
assert.equal(notificationState({ appointmentDate: "2026-09-12T09:00:00Z" }, today), "past");
const afternoon = new Date("2026-09-13T16:30:00Z");
assert.equal(notificationState({ appointmentDate: "2026-09-13" }, afternoon), "upcoming");
assert.equal(notificationState({ appointmentDate: "2026-09-13T09:00:00Z" }, afternoon), "upcoming");
assert.equal(notificationState({ appointmentDate: "2026-09-12T23:59:59Z" }, afternoon), "past");
console.log("notification decision test passed");
