const warpSignaturePermutation = {
  id: "warp_signature_permutation",
  label: "Warp Signature Permutation",
  title: "Warp 실행 구조 서명 permutation 검증",
  description:
    "Warp Signature Repeatability에서 안정적으로 재현된 progress signature가 workload pattern을 따라가는지, 아니면 warp id 또는 warp position에 고정되는지 분리하기 위해 workload pattern assignment를 warp id에 회전 배치한 probe입니다. 이 실험은 signature의 귀속 대상을 확인하는 attribution 단계입니다.",

  status: "observed",
  kind: "experiment",

  // warpSignaturePermutation.js
  layer: "attribution-result",
  order: 1,

  detailPath: "/hardware-evidence/warp_signature_permutation",

  resultSummary: {
    title: "해석 요약",
    conclusion:
      "workload pattern을 warp id에 permutation한 결과, 높은 progress와 낮은 progress의 위치가 warp id에 고정되지 않고 pattern assignment를 따라 이동했습니다. 따라서 현재 조건에서 Warp Signature v0의 progress 차이는 특정 warp id의 고정 bias라기보다 workload execution pattern이 남긴 실행 서명으로 해석할 수 있습니다.",

    metrics: [
      {
        label: "pattern 0",
        value: "584.094",
        note: "가장 높은 평균 progress. 어느 warp에 배치되어도 높은 signature를 유지",
      },
      {
        label: "pattern 1",
        value: "558.820",
        note: "두 번째로 높은 평균 progress",
      },
      {
        label: "pattern 2",
        value: "476.594",
        note: "pattern 0, 1보다 낮은 progress signature",
      },
      {
        label: "pattern 3",
        value: "467.719",
        note: "가장 낮은 평균 progress signature",
      },
      {
        label: "dominant ordering",
        value: "0 > 1 > 2 > 3",
        note: "permutation 이후에도 pattern별 progress ordering 유지",
      },
    ],

    interpretation:
      "permutation 0에서는 pattern 0이 warp 0과 4에 배치되어 높은 progress를 보였고, permutation 1에서는 pattern 0이 warp 3과 7로 이동하자 높은 progress도 함께 이동했습니다. permutation 2와 3에서도 같은 흐름이 반복되었습니다. 이는 progress signature가 warp id 자체보다 workload pattern에 더 강하게 귀속됨을 보여줍니다.",

    caveat:
      "pattern별 progress ordering은 명확하지만, 같은 pattern 내부에서도 1~3 progress 정도의 작은 차이가 남아 있습니다. 따라서 warp position 또는 clock64 boundary 효과가 완전히 배제된 것은 아닙니다. 또한 실험은 단일 block, 동일 launch shape 조건이므로 SM 배치, block scheduling, occupancy 변화까지 일반화해서 해석하면 안 됩니다.",
  },

  probingMeaning:
    "이 node는 반복 가능성이 확인된 warp progress signature의 원인을 분리하는 attribution probe입니다. signature가 warp id에 고정된 것이 아니라 workload execution pattern을 따라 이동한다는 점을 보여주며, 이후 mixed workload와 contention amplification 실험의 해석 기반을 강화합니다.",

  relatedNodes: [
    {
      id: "warp_execution_signature_v0",
      reason:
        "v0에서 관찰된 execution pattern별 progress 차이가 warp id bias가 아니라 workload pattern에 의해 주로 형성되었는지 검증함",
    },
    {
      id: "warp_signature_repeatability",
      reason:
        "반복 실행에서 안정적으로 재현된 signature를 대상으로 pattern attribution을 수행함",
    },
    {
      id: "warp",
      reason:
        "warp-level progress를 기준으로 workload pattern과 warp id 효과를 분리함",
    },
    {
      id: "signature_refinement_plan",
      reason:
        "단일 run observation을 반복성 검증과 pattern attribution을 거쳐 더 신뢰할 수 있는 execution signature로 정제함",
    },
  ],

  connectsTo: [
    {
      id: "mixed_workload_probe",
      type: "next",
    },
  ],
};

export default warpSignaturePermutation;