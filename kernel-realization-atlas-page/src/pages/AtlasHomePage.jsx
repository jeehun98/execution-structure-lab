import { Link } from "react-router-dom";

const chips = [
  "실행 기반",
  "계산 구조",
  "변환 가능성",
  "보존 조건",
  "연산자 해석",
  "실현 비교",
  "생성",
];

const flowSteps = [
  {
    title: "실행 기반",
    desc: "연산이 실제로 놓이는 실행 환경과 실현 조건을 다룹니다. framework, runtime, backend, kernel execution, 그리고 hardware evidence는 이 Atlas의 가장 아래쪽 기반이며, 이후의 모든 구조적 해석은 이 조건 위에서 구체화됩니다.",
  },
  {
    title: "공통 계산 구조",
    desc: "개별 operator보다 먼저, 여러 연산에 반복적으로 나타나는 계산 형식을 식별합니다. reduction, streaming accumulation, mergeable summary 같은 구조는 연산을 다시 읽기 위한 상위 분류 기준이 됩니다.",
  },
  {
    title: "변환 가능성",
    desc: "계산 구조 위에서 어떤 재배열, 분해, 결합, streaming, fusion, rematerialization, residency가 가능해질 수 있는지를 정리합니다. 이 층은 무엇을 바꿀 수 있는지를 설명합니다.",
  },
  {
    title: "보존 조건",
    desc: "구현이 달라져도 유지되어야 하는 의미, dependency, 수치적 일관성을 정리합니다. 이 층은 무엇이 가능하냐보다, 무엇을 끝까지 지켜야 하느냐를 설명합니다.",
  },
  {
    title: "연산자 해석",
    desc: "각 operator를 독립된 이름으로 보지 않고, 어떤 computation structure, property, invariant의 조합으로 이루어지는지 다시 읽습니다. 연산자는 여기서 구조적 조합과 realization branch의 결절점으로 해석됩니다.",
  },
  {
    title: "실현 비교",
    desc: "같은 구조적 해석이 실제 구현에서는 어떤 realization들로 나타나는지 비교합니다. variant와 metric은 단순한 성능 수치가 아니라, 실현 선택의 차이와 trade-off를 드러내는 근거가 됩니다.",
  },
  {
    title: "생성",
    desc: "계산 구조, 변환 가능성, 보존 조건, 실현 경로를 조합해 특정 상황에 맞는 realization 선택과 generation 규칙을 구성합니다. 이 단계에서 Atlas는 설명 체계를 넘어 compiler 혹은 kernel generator의 기준으로 확장됩니다.",
  },
];

const principles = [
  {
    title: "연산자보다 구조를 먼저 본다",
    desc: "개별 operator 이름보다, 그 아래에서 반복적으로 나타나는 계산 형식을 먼저 파악합니다.",
  },
  {
    title: "구조, 변환, 보존, 실현을 분리해 다룬다",
    desc: "계산 구조 자체와, 그 위에서 가능한 재구성, 반드시 유지되어야 하는 조건, 실제 realization 형태를 서로 다른 층으로 구분해 읽습니다.",
  },
  {
    title: "측정은 실현 이해의 일부다",
    desc: "하드웨어 관찰과 구현 실험은 추상 규칙의 부록이 아니라, realization 계층을 이해하고 비교하기 위한 근거입니다.",
  },
  {
    title: "구조적 해석은 생성으로 이어진다",
    desc: "연산자를 상위 구조로 분류하고 realization 후보를 정리할 수 있어야, 그 위에서 compiler 혹은 kernel generation 방향도 더 체계적으로 구성할 수 있습니다.",
  },
];

const primaryCards = [
  {
    title: "하드웨어 관찰",
    desc: "측정과 probing을 통해 realization 선택에 필요한 실행 단서와 물리적 제약을 추적합니다.",
    href: "/hardware-evidence",
  },
  {
    title: "공통 계산 구조",
    desc: "operator 아래에서 반복되는 계산 형식을 먼저 식별합니다.",
    href: "/computation-structures",
  },
  {
    title: "변환 가능성",
    desc: "구조 위에서 어떤 재배열, 분해, 결합, streaming이 가능해지는지를 정리합니다.",
    href: "/properties-new",
  },
  {
    title: "보존 조건",
    desc: "구현이 달라져도 유지되어야 하는 의미, dependency, 수치 경계를 다룹니다.",
    href: "/invariants",
  },
  {
    title: "연산자 해석",
    desc: "각 operator를 structure, property, invariant, realization branch의 결절점으로 다시 읽습니다.",
    href: "/operators-new",
  },
  {
    title: "실현 비교 실험",
    desc: "variant 비교를 통해 어떤 realization이 더 적합한지 평가합니다.",
    href: "/analysis-new",
  },
  {
    title: "메모리 관점",
    desc: "앞선 층들을 intermediate, reuse, residency, traffic 관점에서 다시 절단해 읽습니다.",
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
          연산을 구조로 다시 해석하고
          <br className="hidden lg:block" />
          실현과 생성으로 연결하는 Atlas
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-neutral-400">
          이 Atlas는 AI 연산을 개별 operator의 목록으로 보지 않습니다. 대신
          여러 연산에 반복적으로 나타나는 공통 계산 구조를 먼저 읽고, 그
          위에서 가능한 변환과 반드시 유지되어야 하는 보존 조건을 분리해
          정리합니다. 이렇게 얻은 구조적 해석은 각 operator를 다시 분류하는
          데서 멈추지 않고, 가능한 realization과 구현 변형을 조직하며, 나아가
          compiler 혹은 kernel generation 방향까지 연결됩니다.
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
            유지해야 하는 조건, 선택 가능한 realization은 달라집니다. 이
            Atlas는 연산을 하나의 이름으로 고정해 설명하지 않고, 구조, 변환,
            보존, 실현의 층으로 다시 나누어 해석합니다. 이 계층적 해석은
            단순한 분류를 위한 것이 아니라, 새로운 구현 방식을 조직하고
            generation 규칙까지 구성하기 위한 기반입니다.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">프로젝트의 층</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            이 프로젝트는 기능 목록보다, 연산을 어떤 층으로 다시 나누어
            해석하고 실현으로 연결하는지를 따라 읽는 편이 더 자연스럽습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {flowSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-lime-400/80">
                Layer {index + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {step.desc}
              </p>
            </div>
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
          <h2 className="text-xl font-semibold text-white">핵심 카테고리</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            아래 카테고리에서 구조 해석, 보존 조건, realization 비교, generation
            관점까지 직접 따라갈 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {primaryCards.map((card) => (
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
            공통 계산 구조에서 출발해 변환 가능성과 보존 조건을 먼저 읽고,
            이후 연산자 해석과 실현 비교를 통해 realization 계층을 확인하는
            흐름이 가장 자연스럽습니다. 하드웨어 관찰은 이 흐름 전체에 실제
            실행 근거를 제공하고, 마지막에 메모리 관점과 generation 관점으로
            다시 보면 Atlas가 단순한 분류 체계가 아니라 구현 방식을 조직하는
            프레임이라는 점이 더 분명해집니다.
          </p>
        </div>
      </section>
    </div>
  );
}