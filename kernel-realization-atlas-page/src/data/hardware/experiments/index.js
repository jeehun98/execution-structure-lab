import globalStrideSweepBounded from "./global-memory/global_stride_sweep_bounded";
import globalStrideSweepFixedWork from "./global-memory/global_stride_sweep_fixed_work";

import sharedBankConflictStride from "./shared-memory/shared_bank_conflict_stride";
import sharedPadEffect from "./shared-memory/shared_pad_effect";
import sharedPaddingPeriodSweep from "./shared-memory/shared_padding_period_sweep";
import sharedPaddingPhaseSweep from "./shared-memory/shared_padding_phase_sweep";

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
    headline: "Shared memory bank mapping calibration and residual probes",
    summary:
      "Shared Memory 그룹은 on-chip memory가 항상 빠르다는 일반론을 확인하는 곳이 아닙니다. 먼저 알려진 bank mapping 모델이 실제 timing에서 재현되는지 calibration하고, 그 다음 모델로 설명되지 않는 residual latency structure를 찾는 방향으로 구성됩니다.",
    questions: [
      "warp lane의 shared-memory index pattern은 known bank mapping model과 일치하는 timing ridge를 만드는가?",
      "padding은 conflict를 없애는가, 아니면 known mapping에 따라 spike 위치를 이동시키는가?",
      "같은 predicted conflict degree인데 실제 latency가 달라지는 point가 있는가?",
      "같은 bank histogram인데 shared span, base offset, write mode에 따라 latency가 달라지는가?",
      "median_ms와 max_ms의 차이는 반복적 phase cost와 occasional stall을 어떻게 구분하게 해주는가?",
    ],
    signals: [
      "known-model ridge",
      "P-1 ridge",
      "period multiple ridge",
      "64-near phase band",
      "small-period broad plateau",
      "same-conflict-degree latency spread",
      "median residual spike",
      "max-only stall candidate",
    ],
    interpretationGuide: [
      "P/stride sweep 자체를 discovery로 보지 않는다.",
      "먼저 bank = physical_index % 32 모델로 예측 가능한 구조를 분리한다.",
      "절대 avg_ms보다 median_ms와 normalized median ratio를 먼저 본다.",
      "진짜 관심 대상은 predicted conflict model로 설명되지 않는 residual이다.",
      "같은 conflict degree 또는 같은 bank histogram 내부에서 latency가 갈리는 point를 찾는다.",
      "단일 timing curve만으로 bank conflict를 확정하지 않고, span/base-offset/read-write/Nsight probe와 함께 본다.",
    ],
    experiments: [
      sharedBankConflictStride,
      sharedPadEffect,
      sharedPaddingPeriodSweep,
      sharedPaddingPhaseSweep,
    ],
  }
  
];