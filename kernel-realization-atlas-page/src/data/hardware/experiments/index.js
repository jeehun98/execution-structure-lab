import globalStrideSweepBounded from "./global-memory/global_stride_sweep_bounded";
import globalStrideSweepFixedWork from "./global-memory/global_stride_sweep_fixed_work";

import sharedBankConflictStride from "./shared-memory/shared_bank_conflict_stride";

export const hardwareExperimentsIntro = {
  title: "Probe-based hardware reading",
  desc:
    "각 probe는 하나의 커널이 빠른지 느린지를 평가하기보다, 특정 코드 구조가 GPU의 어떤 실행 메커니즘을 건드리는지 읽기 위한 실험입니다. stride, alignment, padding, register pressure, instruction dependency 같은 변수를 통제하고, latency spike, throughput drop, work collapse, cache reuse 변화 같은 반응을 관찰합니다. 이 결과는 이후 kernel-realization-atlas에서 layout 선택, padding 삽입, vectorized load, shared memory 사용 여부, compiler lowering 검증으로 연결됩니다.",
};

export const hardwareExperimentGroups = [
  {
    id: "global-memory",
    label: "Global Memory",
    headline: "Global memory transaction and access pattern probes",
    summary:
      "global load path를 단순 bandwidth 숫자가 아니라, stride 변화에 따라 workload envelope, warp address continuity, footprint collapse, repeated reuse가 어떻게 함께 반응하는지 읽는 층위로 다룹니다. 현재는 bounded no-wrap probe와 wrapped fixed-work probe를 함께 두어, work collapse와 address-layout response를 분리해서 해석할 수 있게 구성합니다.",

    questions: [
      "stride가 커질 때 시간 변화는 pure penalty인가, 아니면 usable work collapse나 repeated reuse가 함께 섞인 결과인가?",
      "같은 stride sweep이라도 bounded no-wrap과 wrapped fixed-work는 각각 무엇을 보여주는가?",
      "시간 곡선만 보면 놓치기 쉬운 actual work, footprint, warp span 변화는 어떤 해석 차이를 만드는가?",
    ],

    signals: [
      "bounded no-wrap에서 actual_total_accesses와 total_bytes_actual의 급격한 감소",
      "wrapped fixed-work에서 stride 증가에 따른 비단조 time curve와 peak 구간",
      "warp_address_span_bytes 증가와 unique footprint collapse의 결합 패턴",
      "큰 stride 구간에서 나타나는 active thread 감소 또는 repeated reuse 강화",
    ],

    interpretationGuide: [
      "bounded no-wrap 결과는 pure stride penalty보다 usable work envelope 붕괴를 읽는 쪽에 가깝습니다.",
      "wrapped fixed-work 결과는 workload를 고정한 채 address layout만 바꾼 반응이므로, dispersion cost와 reuse transition을 더 직접적으로 읽을 수 있습니다.",
      "같은 stride에서도 avg_ms만 보지 말고 actual_total_accesses, total_bytes_actual, active_threads, footprint 변화를 함께 봐야 합니다.",
      "다른 GPU와 비교할 때는 절대 시간보다 curve shape, peak 위치, recovery 시점, work-collapse 속도를 우선 비교하는 편이 더 안전합니다.",
      "두 probe를 함께 보면 시간 감소가 usable work reduction 때문인지, wrapped reuse 강화 때문인지 더 분리해서 해석할 수 있습니다.",
    ],

    experiments: [
      globalStrideSweepBounded,
      globalStrideSweepFixedWork,
    ],
  },

  {
    id: "shared-memory",
    label: "Shared Memory",
    headline: "Shared memory bank mapping and access pattern probes",
    summary:
      "shared memory를 단순한 on-chip fast memory로 보지 않고, bank mapping, broadcast, conflict, padding effect 같은 warp-local access response를 읽는 층위로 다룹니다. 첫 번째 probe는 stride 변화에 따른 bank conflict 후보 패턴을 관찰하는 baseline 실험입니다.",

    questions: [
      "언제 shared memory가 기대만큼 빠르지 않은가?",
      "특정 stride에서 latency spike는 어떤 bank mapping 문제를 시사하는가?",
      "padding은 실제로 어떤 access spike를 완화하는가?",
    ],

    signals: [
      "특정 stride에서의 latency spike",
      "padding on/off에 따른 curve 차이",
      "broadcast와 conflict 비교 시 나타나는 반응 차이",
      "read와 write 간 민감도 차이",
    ],

    interpretationGuide: [
      "shared memory는 on-chip이라는 이유만으로 항상 빠른 것이 아니라, warp 단위 bank mapping에 크게 좌우됩니다.",
      "특정 stride에서의 spike는 shared bank conflict 후보 신호로 읽을 수 있습니다.",
      "padding 효과가 명확하게 나타나면 layout transformation의 근거가 됩니다.",
      "이후 broadcast 비교 probe를 함께 보면 같은 bank 접근 안에서도 서로 다른 execution response를 더 분리해서 해석할 수 있습니다.",
    ],

    experiments: [sharedBankConflictStride],
  }
];