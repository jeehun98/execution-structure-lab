import globalStrideSweep from "./global_stride_sweep";
import fixedWorkStrideSweep from "./fixed_work_stride_sweep";
import sharedMemoryBankConflict from "./shared_memory_bank_conflict";
import executionPrimitiveProfiles from "./execution_primitive_profiles";
import globalStrideSweepFixedWork from "./global_stride_sweep_fixed_work";

export const hardwareExperiments = [
  globalStrideSweep,
  fixedWorkStrideSweep,
  sharedMemoryBankConflict,
  executionPrimitiveProfiles,
  globalStrideSweepFixedWork,
];

export {
  globalStrideSweep,
  fixedWorkStrideSweep,
  sharedMemoryBankConflict,
  executionPrimitiveProfiles,
  globalStrideSweepFixedWork,
};