import executionPrimitiveProfiles from "./execution_primitive_profiles";
import fixedWorkStrideSweep from "./fixed_work_stride_sweep";
import globalStrideSweep from "./global_stride_sweep";
import sharedMemoryBankConflict from "./shared_memory_bank_conflict";

export const hardwareExperiments = [
  globalStrideSweep,
  fixedWorkStrideSweep,
  sharedMemoryBankConflict,
  executionPrimitiveProfiles,
];

export const hardwareExperimentMap = Object.fromEntries(
  hardwareExperiments.map((experiment) => [experiment.id, experiment])
);