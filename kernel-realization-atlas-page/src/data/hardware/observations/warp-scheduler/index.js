import { sameWorkloadBaselineObservation } from "./same_workload_baseline";
import { warpExecutionSignatureV0Observation } from "./warp_execution_signature_v0";

export const warpSchedulerObservations = [
  sameWorkloadBaselineObservation,
  warpExecutionSignatureV0Observation,
];

export {
  sameWorkloadBaselineObservation,
  warpExecutionSignatureV0Observation,
};