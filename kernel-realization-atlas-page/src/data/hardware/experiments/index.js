import globalStrideSweep from "./global_stride_sweep";
import fixedWorkStrideSweep from "./fixed_work_stride_sweep";
import sharedMemoryBankConflict from "./shared_memory_bank_conflict";
import executionPrimitiveProfiles from "./execution_primitive_profiles";

export const hardwareExperiments = [
  globalStrideSweep,
  fixedWorkStrideSweep,
  sharedMemoryBankConflict,
  executionPrimitiveProfiles,
];

export {
  globalStrideSweep,
  fixedWorkStrideSweep,
  sharedMemoryBankConflict,
  executionPrimitiveProfiles,
};