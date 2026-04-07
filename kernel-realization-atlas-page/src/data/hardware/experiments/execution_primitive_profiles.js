const executionPrimitiveProfiles = {
  id: "execution-primitive-profiles",
  category: "Execution Primitive",
  label: "Execution Primitive Profiles",
  summary:
    "reduction, streaming accumulation, tile staging, rematerialization 같은 primitive family가 실제 GPU에서 어떤 병목 형태를 보이는지 비교하는 실험 묶음입니다.",
  question:
    "같은 high-level 목표를 가지는 realization family라도, primitive structure에 따라 실제 병목 위치와 hardware response는 어떻게 달라지는가?",
  whyItMatters:
    "Atlas가 보고 싶은 것은 단일 커널의 빠르기만이 아니라, 어떤 computation structure가 실제 GPU에서 성립하기 쉬운가입니다. primitive profile 비교는 operator realization을 family 단위로 판단할 수 있게 해줍니다.",

  method: [
    "서로 다른 realization family를 대표하는 micro-kernel 또는 reduced kernel을 준비합니다.",
    "reduction-heavy, streaming-heavy, staging-heavy 형태를 분리해 측정합니다.",
    "throughput, memory pressure, issue sensitivity 같은 응답을 비교합니다.",
    "필요 시 Nsight 기반 metric reading과 함께 해석합니다.",
  ],

  kernelShape: {
    comparedFamilies: [
      "reduction-heavy",
      "streaming accumulation",
      "tile staging",
      "rematerialization-biased",
    ],
    comparisonAxis: [
      "latency sensitivity",
      "memory traffic",
      "local reuse",
      "dependency chain",
    ],
    timing: "microbenchmark / reduced representative kernels",
    validation: "functional parity where possible",
  },

  codeSnippet: `// pseudo-shape only
for (tile = 0; tile < T; ++tile) {
  load_stage(tile);
  accumulate_partial(tile);
  update_running_state(tile);
}`,

  observe: [
    "primitive family별 avg time 차이",
    "memory-bound / compute-bound 경향",
    "dependency chain이 긴 구조의 민감도",
    "local staging이 실제로 이득을 주는 조건",
  ],

  outputs: [
    "family별 profile summary",
    "병목 원인 요약",
    "realization suitability notes",
    "primitive-to-operator 연결 포인트",
  ],

  resultHighlights: [
    "일부 family는 memory traffic 절감으로 유리하지만 dependency pressure가 커질 수 있습니다.",
    "다른 family는 계산량이 늘어도 locality와 staging 덕분에 전체 실행이 더 나을 수 있습니다.",
    "operator choice는 이름이 아니라 primitive profile에 더 가깝게 좌우될 수 있습니다.",
  ],

  interpretation: [
    "operator realization은 개별 트릭보다 primitive family 선택의 문제가 될 수 있습니다.",
    "이 레이어는 어떤 family가 특정 hardware response와 잘 맞는지 판단하기 위한 증거를 제공합니다.",
    "이 결과는 analysis 페이지에서 realization comparison의 출발점이 됩니다.",
  ],

  caveats: [
    "micro-kernel은 full operator의 모든 상호작용을 반영하지 않습니다.",
    "대표 family 선정 방식에 따라 결과 해석이 달라질 수 있습니다.",
    "절대 성능보다 family-level response reading에 더 초점을 둡니다.",
  ],

  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default executionPrimitiveProfiles;