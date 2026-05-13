import { sameWorkloadBaselineObservation } from "./same_workload_baseline";
import { warpExecutionSignatureV0Observation } from "./warp_execution_signature_v0";
import { warpSignaturePermutationObservation } from "./warp_signature_permutation";
import { warpSignatureRepeatabilityObservation } from "./warp_signature_repeatability";


export const warpSchedulerObservations = [
  sameWorkloadBaselineObservation,
  warpExecutionSignatureV0Observation,
  warpSignaturePermutationObservation,
  warpSignatureRepeatabilityObservation,
];

export {
  sameWorkloadBaselineObservation,
  warpExecutionSignatureV0Observation,
  warpSignaturePermutationObservation,
  warpSignatureRepeatabilityObservation,
};  