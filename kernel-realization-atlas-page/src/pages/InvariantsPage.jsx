import { Link } from "react-router-dom";

const invariantGroups = [
  {
    title: "Semantic Invariants",
    desc: "연산의 의미를 보존하기 위해 유지되어야 하는 조건입니다. 입력과 출력의 해석, 연산의 본질적 의미, 허용 가능한 재배열 범위를 다룹니다.",
  },
  {
    title: "Structural Invariants",
    desc: "실행 구조를 바꾸더라도 유지되어야 하는 데이터 의존성과 경계 조건입니다. fusion, tiling, streaming, decomposition 과정에서 깨지면 안 되는 구조적 관계를 다룹니다.",
  },
  {
    title: "Numerical Invariants",
    desc: "수치적으로 동일하거나 허용 가능한 범위 내의 결과를 유지하기 위한 조건입니다. reduction 순서, rescaling, normalization, accumulation 안정성과 연결됩니다.",
  },
];

const ruleCards = [
  {
    title: "허용되는 변환",
    desc: "reordering, tiling, fusion, streaming, rematerialization처럼 invariant를 유지하는 범위 안에서 가능한 변환을 정리합니다.",
  },
  {
    title: "깨지는 조건",
    desc: "어떤 변환이 왜 금지되어야 하는지, 어떤 조건에서 의미나 수치 안정성이 무너지는지를 설명합니다.",
  },
  {
    title: "연산자별 연결",
    desc: "각 operator가 어떤 invariants를 중심으로 이해되어야 하는지와 realization path와의 관계를 이어줍니다.",
  },
];

const nextLinks = [
  {
    title: "최적화 의미 체계",
    href: "/properties-new",
  },
  {
    title: "연산자 실현 구조",
    href: "/operators-new",
  },
  {
    title: "실현 실험실",
    href: "/analysis-new",
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
          변환 속에서도 유지되어야 하는 조건들의 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 최적화나 realization 과정에서 무엇이 유지되어야 하는지를
          정리합니다. Atlas에서 invariants는 단순한 제약 조건이 아니라,
          어떤 변환이 허용되고 어떤 변환이 금지되는지를 가르는 기준입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 불변성</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Invariants는 의미, 구조, 수치 안정성의 세 층에서 이해할 수 있습니다.
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
          <h2 className="text-xl font-semibold text-white">변환 규칙과의 관계</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            invariant는 고정된 설명이 아니라 변환 규칙의 기준점입니다. 어떤
            연산이 reorder될 수 있는지, fusion이 가능한지, streaming으로 바뀔 수
            있는지, rematerialization이 허용되는지는 모두 무엇을 보존해야
            하는가에 달려 있습니다.
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
          <h2 className="text-xl font-semibold text-white">이 층의 역할</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Atlas에서 Invariants는 property와 operator 사이를 연결하는
            해석층입니다. property가 변환 가능성을 제시한다면, invariants는 그
            가능성이 실제로 어디까지 허용되는지를 규정합니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            불변성은 속성 정의, 연산자 realization, 실험 분석으로 이어집니다.
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