import { sameWorkloadBaselineObservation } from "./same_workload_baseline";
import { warpExecutionSignatureV0Observation } from "./warp_execution_signature_v0";
import { warpSignaturePermutationObservation } from "./warp_signature_permutation";
import { warpSignatureRepeatabilityObservation } from "./warp_signature_repeatability";
import { mixedWorkloadProbeObservation } from "./mixedWorkloadProbe";
import { globalMemoryContentionAmplificationProbeObservation } from "./global_memory_contention_amplification_probe";
import { latencyHidingRatioProbeObservation } from "./latency_hiding_ratio_probe";
import { latencyHidingWarmupStabilityProbeObservation } from "./latency_hiding_warmup_stability_probe"; 
import { readyWarpSupplyProbeObservation } from "./ready_warp_supply_probe";
import { sharedMemoryReadyInterferenceProbeObservation } from "./shared_memory_ready_interference_probe";
import { compositionTransientProbeObservation } from "./composition_transient_probe";
import { compositionPhaseRepeatabilityProbeObservation } from "./compositionPhaseRepeatabilityProbeObservation";
import { schedulerPhaseProbeObservation } from "./scheduler_phase_probe";
import { normalizedWindowProbeObservation } from "./normalized_window_probe";
import { launchPerturbationProbeObservation } from "./launchPerturbationProbeObservation";


export const warpSchedulerObservations = [
  sameWorkloadBaselineObservation,
  warpExecutionSignatureV0Observation,
  warpSignaturePermutationObservation,
  warpSignatureRepeatabilityObservation,
  mixedWorkloadProbeObservation,
  globalMemoryContentionAmplificationProbeObservation,
  latencyHidingRatioProbeObservation,
  latencyHidingWarmupStabilityProbeObservation,
  readyWarpSupplyProbeObservation,
  sharedMemoryReadyInterferenceProbeObservation,
  compositionTransientProbeObservation,
  compositionPhaseRepeatabilityProbeObservation,
  schedulerPhaseProbeObservation,
  normalizedWindowProbeObservation,
  launchPerturbationProbeObservation,
];

export {
  sameWorkloadBaselineObservation,
  warpExecutionSignatureV0Observation,
  warpSignaturePermutationObservation,
  warpSignatureRepeatabilityObservation,
  mixedWorkloadProbeObservation,
  globalMemoryContentionAmplificationProbeObservation,
  latencyHidingRatioProbeObservation,
  latencyHidingWarmupStabilityProbeObservation,
  readyWarpSupplyProbeObservation,
  sharedMemoryReadyInterferenceProbeObservation,
  compositionTransientProbeObservation,
  compositionPhaseRepeatabilityProbeObservation,
  schedulerPhaseProbeObservation,
  normalizedWindowProbeObservation,
  launchPerturbationProbeObservation,
};  