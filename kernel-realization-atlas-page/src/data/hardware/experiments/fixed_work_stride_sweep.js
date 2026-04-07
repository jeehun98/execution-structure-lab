const fixedWorkStrideSweep = {
  id: "fixed-work-stride-sweep",
  label: "Fixed-Work Stride Sweep",
  category: "Memory Response",
  summary:
    "총 작업량을 고정한 채 stride만 바꿔 access pattern 자체가 hardware response에 미치는 영향을 더 분리해 관찰합니다.",
  question:
    "작업량 변화 효과를 제거하면 stride 그 자체가 실제 비용 구조에 어떤 영향을 주는가?",
  whyItMatters:
    "단순 stride sweep은 작업량 변화가 함께 섞일 수 있습니다. fixed-work 버전은 access pattern 자체의 영향을 더 깨끗하게 분리해 보여줍니다.",
  observe: [
    "동일 work budget에서의 stride response",
    "transaction inefficiency 증가",
    "locality 손실의 순수 영향",
    "실험 해석의 분리 가능성",
  ],
  outputs: [
    "fixed work configuration",
    "stride vs runtime",
    "stride vs normalized cost",
  ],
  nextLinks: [
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "공통 계산 구조 보기", href: "/computation-structures" },
  ],
};

export default fixedWorkStrideSweep;