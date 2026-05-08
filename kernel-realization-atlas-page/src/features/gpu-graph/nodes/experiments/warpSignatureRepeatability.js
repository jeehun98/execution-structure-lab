const warpSignatureRepeatability = {
  id: "warp_signature_repeatability",
  label: "Warp Signature Repeatability",
  title: "Warp 실행 구조 서명 반복성 검증",
  description:
    "Warp Signature v0에서 관찰된 workload별 progress signature가 단일 run의 우연한 흔들림인지, 동일 조건에서 반복 실행해도 유지되는 안정적인 실행 서명인지 검증하는 probe입니다. 이 실험은 새로운 workload class를 추가하는 실험이 아니라, 기존 signature observation의 재현성을 확인하기 위한 validation 단계입니다.",

  status: "observed",
  kind: "experiment",
  
  // warpSignatureRepeatability.js
  layer: "follow-up-result",
  order: 1,

  detailPath: "/hardware-evidence/warp_signature_repeatability",

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "동일한 launch shape, 동일한 cycle budget, 동일한 workload pattern 조건에서 64회 반복 실행한 결과, warp별 progress signature가 모든 run에서 완전히 동일하게 재현되었습니다. 따라서 현재 조건에서는 v0에서 관찰된 progress 차이를 단일 run noise가 아니라 안정적인 workload execution signature로 볼 수 있습니다.",

    metrics: [
      {
        label: "run count",
        value: "64",
        note: "동일 조건 반복 실행 횟수",
      },
      {
        label: "warp progress signature",
        value: "[588, 560, 478, 466, 588, 561, 479, 466]",
        note: "64회 run 전체에서 동일하게 관찰된 progress 배열",
      },
      {
        label: "coefficient of variation",
        value: "0",
        note: "모든 warp에서 run-to-run 변동 없음",
      },
      {
        label: "pattern repetition",
        value: "0≈4, 1≈5, 2≈6, 3≈7",
        note: "local_warp_id & 3 기반 workload pattern이 반복적으로 같은 signature를 남김",
      },
    ],

    interpretation:
      "이 결과는 warp별 progress signature가 단일 launch에서만 우연히 보인 값이 아니라, 현재 kernel 구조와 동일 실행 조건 안에서 반복 가능한 구조적 관찰값임을 보여줍니다. 특히 warp 0과 4, 1과 5, 2와 6, 3과 7이 유사한 progress를 보인 것은 workload pattern 배정 방식이 progress signature에 반영되었음을 시사합니다.",

    caveat:
      "다만 이 결과는 단일 block, 동일 launch shape, 동일 cycle budget 조건에서의 반복성 검증입니다. 아직 SM 배치 차이, block scheduling, occupancy 변화, warp id 자체의 위치 효과는 분리하지 않았으므로, 일반적인 warp scheduler 법칙이나 절대적인 연산 속도비로 해석해서는 안 됩니다.",
  },

  probingMeaning:
    "이 node는 Warp Signature v0의 관찰값이 반복 가능한 실행 서명인지 검증하는 validation node입니다. v0가 execution pattern별 signature 후보를 만든 단계라면, 이 실험은 그 signature가 run-to-run noise가 아니라 동일 조건에서 재현되는 안정적 관찰값임을 확인하는 단계입니다.",

  relatedNodes: [
    {
      id: "warp_execution_signature_v0",
      reason:
        "v0에서 관찰된 workload별 progress signature의 반복성을 직접 검증하는 후속 probe",
    },
    {
      id: "warp",
      reason:
        "warp-level progress 배열이 반복 실행에서 동일하게 유지되는지 관찰함",
    },
    {
      id: "signature_refinement_plan",
      reason:
        "단일 run observation을 안정적인 signature 해석으로 끌어올리기 위한 refinement 단계",
    },
  ],

  connectsTo: [
    {
      id: "warp_signature_permutation",
      type: "signature-attribution",
      label: "repeatability → attribution",
    },
  ]
};

export default warpSignatureRepeatability;