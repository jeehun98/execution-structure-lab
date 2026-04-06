import { Link } from "react-router-dom";

const invariantGroups = [
  {
    title: "Meaning Boundaries",
    desc: "각 computation structure가 원래 무엇을 계산하는지에서 벗어나지 않도록 붙는 보존 조건입니다. 같은 결과를 향한 다른 realization이라도, summary의 의미, aggregation 대상, 축과 범위 같은 계산 경계는 유지되어야 합니다.",
  },
  {
    title: "Dependency Boundaries",
    desc: "fusion, tiling, streaming, decomposition 이후에도 깨지면 안 되는 데이터 의존성과 구조적 경계를 다룹니다. 부분 결과를 나누고 다시 합칠 수 있으려면, 각 조각이 전체 계산 안에서 어떤 관계를 갖는지 보존되어야 합니다.",
  },
  {
    title: "Numerical Boundaries",
    desc: "재배열과 누적 방식이 달라져도 허용 가능한 범위 안에서 같은 수치적 의미를 유지하기 위한 조건입니다. accumulation 순서, rescaling, normalization, merge rule의 안정성이 이 층에서 다뤄집니다.",
  },
];

const ruleCards = [
  {
    title: "구조 위의 허용 범위",
    desc: "invariant는 어떤 변환이 가능한지를 직접 제안하지 않습니다. 대신 reduction, streaming accumulation, mergeable summary 같은 구조가 어디까지 바뀔 수 있는지 그 한계를 규정합니다.",
  },
  {
    title: "깨지는 지점의 식별",
    desc: "어떤 변환이 금지되는 이유는 단순히 구현이 다르기 때문이 아니라, structure가 기대하는 의미 경계나 dependency, numerical rule을 무너뜨리기 때문입니다.",
  },
  {
    title: "실현 비교의 기준",
    desc: "서로 다른 realization을 비교할 때도 invariant는 기준점으로 작동합니다. 구현 방식이 달라도 같은 structure를 유지하는지, 혹은 다른 structure로 넘어가는지를 이 층에서 구분할 수 있습니다.",
  },
];

const structureExamples = [
  {
    title: "Reduction",
    desc: "축, 결합 규칙, neutral element, accumulation domain이 유지되어야 합니다. 순서를 바꾸거나 타일로 쪼갤 수 있어도, 최종 summary가 같은 계산 의미를 가져야 합니다.",
  },
  {
    title: "Streaming Accumulation",
    desc: "chunk 단위로 나누어 계산하더라도 partial state가 전체 누적 의미와 호환되어야 합니다. local update와 global merge가 같은 rule 위에 있어야 streaming이 성립합니다.",
  },
  {
    title: "Mergeable Summary",
    desc: "부분 요약을 만든 뒤 다시 결합할 수 있으려면 summary state 자체가 merge 가능한 형식을 가져야 합니다. local summary와 merged summary가 같은 해석 안에 있어야 합니다.",
  },
];

const nextLinks = [
  {
    title: "공통 계산 구조",
    href: "/computation-structures",
  },
  {
    title: "변환 규칙",
    href: "/properties-new",
  },
  {
    title: "연산자 실현 구조",
    href: "/operators-new",
  },
];

export default function InvariantsPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Invariants
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          계산 구조가 변환 속에서도
          <br className="hidden lg:block" />
          유지해야 하는 경계들의 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 operator의 이름을 다시 설명하지 않습니다. 대신
          computation structure 위에서 가능한 재배열, 분해, 결합, streaming이
          어디까지 허용될 수 있는지를 가르는 보존 조건을 정리합니다. Atlas에서
          invariants는 단순한 제약이 아니라, 구조가 구조로 남기 위해 끝까지
          지켜야 하는 경계입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 경계</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Invariants는 의미, 의존성, 수치 안정성의 세 층에서 읽을 수
            있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {invariantGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{group.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {group.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            변환 규칙과의 관계
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            property가 어떤 변환이 가능할 수 있는지를 말한다면, invariant는 그
            가능성이 실제로 어디서 멈춰야 하는지를 정합니다. reorder, fusion,
            tiling, streaming, rematerialization은 모두 structure를 유지하는
            범위 안에서만 허용됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {ruleCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            구조별로 보는 불변성
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            invariant는 추상적 규칙의 목록이 아니라, 각 computation structure가
            어떤 방식으로 유지되어야 하는지를 드러내는 해석층입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {structureExamples.map((item) => (
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

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">이 층의 역할</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Atlas에서 Invariants는 property와 operator 사이를 잇는 제한 조건의
            층이면서, 동시에 computation structure를 realization 비교로
            넘겨주기 전에 붙는 검증 경계이기도 합니다. 구조를 읽는 것만으로는
            충분하지 않고, 그 구조가 무엇을 끝까지 유지해야 하는지를 함께
            알아야 실현 선택과 generation 규칙도 더 정확해집니다.
          </p>
        </div>
      </section>

      <section className="space-y-4"> 
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            계산 구조에서 출발해 변환 규칙을 보고, 그 위에서 무엇을 보존해야
            하는지를 읽은 뒤 연산자 실현 구조로 넘어가는 흐름이 가장
            자연스럽습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {nextLinks.map((link) => (
            <Link
              key={link.title}
              to={link.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-medium text-neutral-300 transition hover:border-lime-400/40 hover:bg-white/10 hover:text-white"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}