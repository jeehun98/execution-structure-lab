const globalStrideSweep = {
  id: "global-stride-sweep",
  label: "Global Stride Sweep",
  category: "Memory Response",
  summary:
    "stride 변화에 따라 memory transaction cost와 coalescing 양상이 어떻게 달라지는지 측정합니다.",
  question:
    "연속 접근이 무너질 때 GPU는 어떤 비용 증가를 보이는가? stride는 어느 지점부터 locality와 throughput에 직접적인 손실을 주는가?",
  whyItMatters:
    "같은 연산도 access pattern이 달라지면 실제 realization quality가 크게 달라집니다. 이 실험은 memory access shape가 realization 선택에 어떤 제약을 만드는지 확인하는 출발점입니다.",
  observe: [
    "stride 증가에 따른 시간 변화",
    "coalescing 붕괴 시점",
    "bandwidth 활용 저하",
    "연속 접근 대비 비용 증가율",
  ],
  outputs: [
    "stride vs avg_ms",
    "stride vs effective bandwidth",
    "response curve interpretation",
  ],
  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default globalStrideSweep;