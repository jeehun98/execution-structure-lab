import { mode0BaselineObservation } from "./mode0_baseline";

export const warpSchedulerObservations = [
  mode0BaselineObservation,
];

export const warpSchedulerObservationGroup = {
  id: "warp-scheduler",
  label: "Warp Scheduler",
  summary:
    "warp별 progress, last_clock, dependency chain, stall 이후 재진입 패턴을 관찰한다.",
  observations: warpSchedulerObservations,
};