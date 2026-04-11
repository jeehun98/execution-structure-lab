import executionPrimitiveProfiles from "./execution_primitive_profiles";
import globalStrideSweepBoundedNoWrap from "./global_stride_sweep_bounded";
import globalStrideSweepFixedWork from "./global_stride_sweep_fixed_work";
import sharedMemoryBankConflict from "./shared_memory_bank_conflict";

export const hardwareExperimentsIntro = {
  title: "Stride Response Probes",
  desc: "이 실험 묶음은 stride 변화 자체보다, stride 변화가 어떤 실행 조건 안에서 해석되어야 하는지를 보여줍니다. Wrapped fixed-work는 같은 양의 일을 유지한 채 address dispersion과 repeated reuse가 어떤 곡선을 만드는지 보여주고, bounded no-wrap는 같은 stride 변화가 usable work collapse로 어떻게 바뀌는지를 보여줍니다. 즉 여기서 중요한 것은 어느 stride가 빠른가가 아니라, address-space handling 방식에 따라 hardware response의 의미가 어떻게 달라지는가입니다.",
};

export const hardwareExperiments = [
  globalStrideSweepFixedWork,
  globalStrideSweepBoundedNoWrap,
  sharedMemoryBankConflict,
  executionPrimitiveProfiles,
];