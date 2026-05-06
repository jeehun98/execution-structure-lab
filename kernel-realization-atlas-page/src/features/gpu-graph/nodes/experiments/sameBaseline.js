const sameBaseline = {
  id: "same_workload_baseline",
  label: "Same Workload Baseline",
  title: "동일 task baseline",
  description:
    "동일한 independent ALU workload를 여러 warp에 부여해 장기 progress 편향이 발생하는지 관찰합니다.",
  status: "observed",

  connectsTo: [
    {
      id: "mixed_workload_probe",
      type: "next",
    },
  ],
};

export default sameBaseline;