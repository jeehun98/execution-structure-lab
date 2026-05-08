import sameBaseline from "./sameBaseline";
import warpExecutionSignatureV0 from "./warpExecutionSignatureV0";
import warpSignatureRepeatability from "./warpSignatureRepeatability";
import warpSignaturePermutation from "./warpSignaturePermutation";
import mixedWorkloadProbe from "./mixedWorkloadProbe";

export const experimentNodes = [
  sameBaseline,
  warpExecutionSignatureV0,
  warpSignatureRepeatability,
  warpSignaturePermutation,
  mixedWorkloadProbe,
];

export {
  sameBaseline,
  warpExecutionSignatureV0,
  warpSignatureRepeatability,
  warpSignaturePermutation,
  mixedWorkloadProbe,
};