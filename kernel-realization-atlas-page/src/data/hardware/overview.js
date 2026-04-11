export const hardwareOverview = {
  eyebrow: "Hardware Evidence",
  title: "Measured hardware response, not abstract capability",
  description:
    "이 레이어는 GPU가 실제로 어떻게 반응하는지를 측정 기반으로 다룹니다. 단순한 스펙 정리나 이론 설명이 아니라, probing kernel과 실행 결과를 통해 memory hierarchy, access pattern, bank behavior, issue pattern, execution primitive의 단서를 역으로 읽어냅니다. 여기서 중요한 것은 하드웨어 내부 규칙을 완전히 복원하는 것이 아니라, 어떤 주소 구조와 계산 구조가 실제 실행에서 어떤 비용 곡선을 만들고, 어떤 조건에서 usable work surface가 무너지며, 어떤 realization family가 더 자연스럽게 성립하는지를 파악하는 것입니다.",
  whyItMatters:
    "Atlas가 필요한 것은 '이 GPU가 빠르다' 같은 일반론이 아니라, 어떤 구조가 실제 하드웨어 반응과 잘 맞는지에 대한 증거입니다. 같은 stride 변화라도 wrapped fixed-work에서는 dispersion과 reuse의 곡선으로, bounded no-wrap에서는 usable work collapse의 곡선으로 읽혀야 하듯, 실험 조건 하나만 달라도 결과의 의미는 달라집니다. 그래서 이 층의 역할은 단순 benchmark 수집이 아니라, execution path 위에서 어떤 반응이 어디서 튀어나오는지 읽고, 그 반응을 operator realization과 primitive family 선택으로 연결하는 데 있습니다.",
};