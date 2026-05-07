import { warpSchedulerObservations } from "./warp-scheduler";

export const hardwareObservations = [
  ...warpSchedulerObservations,
];

export function findHardwareObservationById(id) {
  return hardwareObservations.find((observation) => observation.id === id);
}

export {
  warpSchedulerObservations,
};