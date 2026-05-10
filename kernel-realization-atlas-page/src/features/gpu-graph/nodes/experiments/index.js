import sameBaseline from "./sameBaseline";
import warpExecutionSignatureV0 from "./warpExecutionSignatureV0";
import warpSignatureRepeatability from "./warpSignatureRepeatability";
import warpSignaturePermutation from "./warpSignaturePermutation";
import mixedWorkloadProbe from "./mixedWorkloadProbe";
import globalMemoryContentionAmplificationProbe from "./globalMemoryContentionAmplificationProbe";
import latencyHidingRatioProbe from "./latencyHidingRatioProbe";
import latencyHidingWarmupStabilityProbe from "./latencyHidingWarmupStabilityProbe ";
import readyWarpSupplyProbe from "./readyWarpSupplyProbe";
import sharedMemoryReadyInterferenceProbe from "./sharedMemoryReadyInterferenceProbe ";


export const experimentNodes = [
  sameBaseline,
  warpExecutionSignatureV0,
  warpSignatureRepeatability,
  warpSignaturePermutation,
  mixedWorkloadProbe,
  globalMemoryContentionAmplificationProbe,
  latencyHidingRatioProbe,
  latencyHidingWarmupStabilityProbe,
  readyWarpSupplyProbe,
  sharedMemoryReadyInterferenceProbe,
];

export {
  sameBaseline,
  warpExecutionSignatureV0,
  warpSignatureRepeatability,
  warpSignaturePermutation,
  mixedWorkloadProbe,
  globalMemoryContentionAmplificationProbe,
  latencyHidingRatioProbe,
  latencyHidingWarmupStabilityProbe,
  readyWarpSupplyProbe,
  sharedMemoryReadyInterferenceProbe,
};