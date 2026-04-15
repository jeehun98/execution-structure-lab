import globalStrideSweepBoundedNoWrap from "./global_stride_sweep_bounded";
import globalStrideSweepFixedWork from "./global_stride_sweep_fixed_work";

export const hardwareExperimentsIntro = {
  title: "이 목록을 읽는 기준",
  desc: "여기의 실험들은 절대 성능을 비교하기 위한 목록이 아닙니다. 각 probe는 하나의 커널 코드가 무엇을 확인하게 해주는지를 보여줍니다. 중요한 것은 숫자 자체보다, 코드 구조와 관찰 결과를 함께 보면서 어떤 실행 특성과 제약을 읽을 수 있는가입니다.",
};

export const hardwareExperiments = [
  globalStrideSweepFixedWork,
  globalStrideSweepBoundedNoWrap,
];