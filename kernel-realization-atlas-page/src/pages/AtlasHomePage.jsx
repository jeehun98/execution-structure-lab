import { Link } from "react-router-dom";

const chips = [
  "실행 기반",
  "GPU 관찰",
  "계산 구조",
  "변환 가능성",
  "보존 조건",
  "실현 비교",
  "생성",
];

const layers = [
  {
    title: "하드웨어 관찰",
    desc: "GPU 성능 측정과 probing을 통해 실제 실행 특성과 병목의 단서를 수집하고, 관찰된 결과를 다시 하드웨어 메커니즘과 실행 제약 수준으로 역추적합니다.",
    href: "/gpu-graph-test",
  },
  {
    title: "공통 계산 구조",
    desc: "개별 operator 이름보다 먼저, 여러 연산에 반복적으로 나타나는 계산 형식을 식별합니다. reduction, streaming accumulation, mergeable summary 같은 구조는 이후 구현 선택을 조직하는 상위 단위가 됩니다.",
    href: "/computation-structures",
  },
  {
    title: "변환 가능성",
    desc: "어떤 구조가 재배열, 분해, 결합, fusion, rematerialization, residency 최적화로 이어질 수 있는지를 정리합니다. 무엇을 바꿀 수 있는지와 어떤 구현 방향이 실제로 열려 있는지를 함께 설명합니다.",
    href: "/properties-new",
  },
  {
    title: "보존 조건",
    desc: "구현이 달라져도 유지되어야 하는 의미, dependency, 수치적 일관성을 다룹니다. 동시에 어떤 계산이 어떤 admissible form 안에 머물러야 하는지도 함께 규정합니다.",
    href: "/invariants",
  },
  {
    title: "연산자 해석",
    desc: "각 operator를 독립된 이름으로 보지 않고, 어떤 computation structure, property, invariant의 조합으로 이루어지는지 다시 읽습니다. 연산자는 구조적 분류와 realization branch가 만나는 지점이 됩니다.",
    href: "/operators-new",
  },
  {
    title: "실현 비교",
    desc: "같은 구조적 해석이 실제 구현에서 어떤 realization들로 나타나는지를 비교합니다. variant와 metric은 단순 성능 기록이 아니라, 구현 선택이 어떤 제약, 안정성, locality, trade-off를 갖는지 보여주는 근거가 됩니다.",
    href: "/analysis-new",
  },
  {
    title: "생성",
    desc: "계산 구조, 변환 가능성, 보존 조건, 실현 비교를 바탕으로 상황에 맞는 realization 선택과 generation 규칙을 구성합니다. 이 단계에서 Atlas는 설명 체계를 넘어 compiler 혹은 kernel generator의 기준으로 확장됩니다.",
    href: "/generation",
  },
];

const principles = [
  {
    title: "연산자 이름보다 실행 구조를 먼저 본다",
    desc: "이 프로젝트는 operator를 고정된 단위로 외우기보다, 그 아래에서 반복되는 계산 구조와 실행 조건을 먼저 읽는 방식으로 출발합니다.",
  },
  {
    title: "구조는 성질을 강제할 수 있어야 한다",
    desc: "계산 구조는 단순한 분류 단위가 아니라, 정규화, 안정성, 확률적 해석 같은 성질이 후처리가 아니라 내부 제약으로 드러나게 만드는 실행 조건이어야 합니다.",
  },
  {
    title: "구조와 구현을 분리하되 끊어놓지 않는다",
    desc: "계산 구조, 변환 가능성, 보존 조건, realization은 서로 다른 층으로 다루지만, 최종적으로는 실제 구현 선택과 generation 규칙으로 다시 연결되어야 합니다.",
  },
  {
    title: "하드웨어 관찰은 출발점이다",
    desc: "GPU probing과 측정은 추상 이론의 부록이 아니라, 어떤 realization이 실제로 성립하고 유리한지를 판단하기 위한 출발점입니다.",
  },
];

const crossCuts = [
  {
    title: "메모리 관점",
    desc: "앞선 층들을 intermediate, reuse, residency, traffic 관점으로 다시 절단해 구현 관점에서 재해석합니다.",
    href: "/memory-new",
  },
];

export default function AtlasHomePage() {
  return (
    <div className="space-y-16">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Kernel Realization Atlas
        </p>

        <h1 className="mt-4 max-w-6xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          연산을 구조로 다시 읽고
          <br className="hidden lg:block" />
          성질을 강제하는 실제 구현 선택과 생성으로 연결하는 Atlas
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-neutral-400">
          이 Atlas는 AI 연산을 개별 operator 목록으로 정리하는 데서 멈추지
          않습니다. 먼저 여러 연산에 반복적으로 나타나는 공통 계산 구조를
          식별하고, 그 위에서 가능한 변환과 유지되어야 하는 보존 조건을
          분리해 봅니다. 또 어떤 구조와 제약이 정규화, 안정성, 확률적 해석
          같은 성질을 후처리 없이 계산 안에서 드러내는지도 함께 다룹니다.
          이러한 구조적 해석은 실제 실행 환경과 하드웨어 관찰, realization 비교,
          구현 변형 조직으로 이어지며, 최종적으로 compiler 혹은 kernel
          generation의 기준으로 확장됩니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-neutral-300">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">왜 이 Atlas인가</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-neutral-400">
            같은 수학적 연산이라도, 어떤 계산 구조로 읽느냐에 따라 가능한 변환,
            유지해야 하는 조건, 선택 가능한 realization은 달라집니다. 더 나아가
            어떤 구조는 결과를 특정 admissible form에 머물게 하거나, 정규화와
            안정성 같은 성질을 별도 후처리 없이 내부에서 강제할 수 있습니다.
            이 프로젝트는 연산을 하나의 이름으로 고정해 설명하지 않고, 실행
            기반, 구조, 변환, 보존, 실현, 생성의 흐름으로 다시 나누어 해석합니다.
            목적은 단순한 분류가 아니라, 실제 구현 방식을 더 정확하게 조직하고
            새로운 realization을 설계하며 generation 기준을 만드는 데 있습니다.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 구조</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            아래 흐름을 따라가면 실행 기반에서 출발해 구조 해석, 보존 조건,
            realization 비교, generation까지 한 축으로 읽을 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {layers.map((layer, index) => (
            <Link
              key={layer.title}
              to={layer.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-lime-400/40 hover:bg-white/10"
            >
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-lime-400/80">
                Layer {index + 1}
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                {layer.title}
              </div>
              <div className="mt-3 text-sm leading-6 text-neutral-400">
                {layer.desc}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 관점</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            이 Atlas를 관통하는 해석 원칙들입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">횡단 관점</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            아래 항목은 특정 한 층에만 속하지 않고, 여러 레이어를 가로질러
            구조와 구현을 다시 읽게 만드는 관점입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {crossCuts.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-lime-400/40 hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">{card.title}</div>
              <div className="mt-3 text-sm leading-6 text-neutral-400">
                {card.desc}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">추천 탐색 순서</h2>
          <p className="max-w-4xl text-sm leading-7 text-neutral-400">
            구조 중심으로 읽는다면 공통 계산 구조에서 출발해 변환 가능성과 보존
            조건을 먼저 본 뒤, 연산자 해석과 실현 비교, 생성으로 내려가는 흐름이
            자연스럽습니다. 반대로 구현 중심으로 읽는다면 실행 기반에서 시작해
            어떤 구조가 실제 realization 선택으로 이어지고 어떤 제약이 구현의
            안정성과 admissible form을 붙잡는지를 거꾸로 따라갈 수도 있습니다.
            마지막에 메모리 관점까지 함께 보면, 이 Atlas가 단순한 설명 체계가
            아니라 구조와 성질을 함께 조직하는 실행 프레임이라는 점이 더
            분명해집니다.
          </p>
        </div>
      </section>
    </div>
  );
}