const mixedProbe = {
  id: "mixed_workload_probe",
  label: "Mixed Workload Probe",
  title: "다른 task 비교",
  description:
    "baseline 이후 warp마다 dependent ALU, shared load, global load를 부여해 progress 분포 차이를 관찰합니다.",
  status: "planned",

  connectsTo: [],
};

export default mixedProbe;