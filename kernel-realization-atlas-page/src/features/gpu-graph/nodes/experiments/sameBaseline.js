const sameBaseline = {
  id: "same_workload_baseline",
  label: "Same Workload Baseline",
  title: "동일 task baseline",
  description:
    "동일한 independent ALU workload를 여러 warp에 부여해 장기 실행에서 warp 간 progress 편향이 발생하는지 관찰합니다.",
  status: "observed",
  kind: "experiment",

  resultSummary: {
    title: "관찰 결과",
    conclusion:
      "동일 independent ALU workload 조건에서는 warp_id 0~3 사이의 장기 progress 편향이 관찰되지 않았습니다.",
    metrics: [
      {
        label: "progress",
        value: "459,715",
        note: "4개 warp 모두 동일",
      },
      {
        label: "warp count",
        value: "4",
        note: "단일 block 내 warp 0~3",
      },
      {
        label: "clock delta",
        value: "+4 cycles",
        note: "최종 기록 시점 기준",
      },
      {
        label: "sink",
        value: "0",
        note: "result-cancellation 보강 필요",
      },
    ],
    caveat:
      "이 결과만으로 scheduler가 round-robin이거나 warp_id 순서로 issue한다고 단정할 수는 없습니다.",
  },

  detailPath: "/hardware-evidence/warp_issue_policy_probe_mode0_baseline",

  connectsTo: [
    {
      id: "mixed_workload_probe",
      type: "next",
    },
  ],
};

export default sameBaseline;