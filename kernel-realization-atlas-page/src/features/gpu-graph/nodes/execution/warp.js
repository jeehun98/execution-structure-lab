const warp = {
  id: "warp",
  label: "Warp",
  title: "Warp",
  description: "GPU execution의 기본 단위",
  status: "active",

  connectsTo: [
    {
      id: "same_workload_baseline",
      type: "baseline",
    },
  ],
};

export default warp;