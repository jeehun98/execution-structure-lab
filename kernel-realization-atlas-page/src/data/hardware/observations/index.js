import {
  warpSchedulerObservationGroup,
  warpSchedulerObservations,
} from "./warp-scheduler";

export const hardwareObservationGroups = [
  warpSchedulerObservationGroup,
];

export const hardwareObservations = [
  ...warpSchedulerObservations,
];

export function findHardwareObservationById(id) {
  return hardwareObservations.find((observation) => observation.id === id);
}