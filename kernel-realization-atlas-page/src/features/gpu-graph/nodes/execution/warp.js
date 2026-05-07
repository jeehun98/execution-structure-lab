const warp = {
  id: "warp",
  label: "Warp",
  title: "Warp",
  description:
    "Warp는 GPU에서 instruction issue와 execution progress를 관찰할 때 기준이 되는 실행 단위입니다. 여러 thread가 하나의 instruction stream을 따라 실행되며, scheduler 관찰의 기본 단위로 사용됩니다.",
  status: "active",
  kind: "execution",

  connectsTo: [
    {
      id: "same_workload_baseline",
      type: "baseline",
    },
  ],
};

export default warp;