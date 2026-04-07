export const hardwareOverview = {
  eyebrow: "Hardware Evidence",
  title: "불투명한 GPU 거동을 역추적해 realization 선택 근거를 확보하는 층",
  description:
    "이 레이어는 GPU가 실제로 어떻게 반응하는지를 측정 기반으로 다룹니다. 단순한 스펙 정리나 이론 설명이 아니라, probing kernel과 실행 결과를 통해 memory hierarchy, access pattern, bank behavior, issue pattern, execution primitive의 단서를 역으로 읽어냅니다. 여기서 얻은 관찰은 어떤 realization family가 실제로 성립하고, 어떤 구현 방식이 더 적절한지 판단하는 근거로 이어집니다.",
  whyItMatters:
    "의미적으로 허용되는 변환이 항상 좋은 실행으로 이어지지는 않습니다. 같은 연산 의미라도 memory layout, scheduling pressure, transaction behavior, shared memory access pattern에 따라 실제 비용 구조는 크게 달라집니다. Hardware Evidence는 이 불투명한 차이를 실험으로 드러내고, realization 선택을 위한 물리적 근거를 마련하는 층입니다.",
};