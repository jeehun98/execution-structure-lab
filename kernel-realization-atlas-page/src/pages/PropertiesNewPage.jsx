import { Link } from "react-router-dom";

const propertyGroups = [
  {
    title: "Reordering Properties",
    desc: "연산 순서를 바꾸거나 일부 계산을 재배치할 수 있게 만드는 성질입니다. associativity, commutativity, partial reordering 가능성과 연결됩니다.",
  },
  {
    title: "Decomposition Properties",
    desc: "연산을 더 작은 단위로 나누거나 tile 형태로 분해할 수 있게 만드는 성질입니다. block decomposition, staged execution, locality 확보와 연결됩니다.",
  },
  {
    title: "Streaming Properties",
    desc: "전체를 한 번에 물질화하지 않고 순차적으로 처리할 수 있게 만드는 성질입니다. online update, streaming reduction, running state 유지와 연결됩니다.",
  },
  {
    title: "Fusion Properties",
    desc: "여러 연산을 하나의 realization path로 묶을 수 있게 만드는 성질입니다. producer-consumer 관계, epilogue fusion, intermediate 제거와 연결됩니다.",
  },
  {
    title: "Rematerialization Properties",
    desc: "중간 결과를 저장하는 대신 다시 계산하는 것이 가능한지에 대한 성질입니다. memory traffic 절감과 recompute trade-off 판단의 기준이 됩니다.",
  },
  {
    title: "Residency Properties",
    desc: "데이터를 registers, shared memory, cache 같은 on-chip 자원에 머물게 하며 재사용할 수 있는지를 설명하는 성질입니다.",
  },
];

const roleCards = [
  {
    title: "변환 가능성의 출발점",
    desc: "properties는 어떤 변환이 가능한지를 처음 제시합니다. 하지만 그 자체로 변환을 정당화하지는 않습니다.",
  },
  {
    title: "불변성과의 연결",
    desc: "각 property는 invariant와 함께 읽혀야 합니다. 가능성은 property가 제시하고, 허용 범위는 invariant가 제한합니다.",
  },
  {
    title: "실현 구조로의 연결",
    desc: "property는 결국 operator realization과 fusion path에서 실제 구현 형태로 이어집니다.",
  },
];

const nextLinks = [
  {
    title: "불변성 보기",
    href: "/invariants",
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

export default function PropertiesNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Optimization Semantics
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          연산이 어떤 변환 가능성을 가지는지를 설명하는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 각 연산 또는 연산 패턴이 어떤 형태의 변환을 받아들일 수
          있는지를 정리합니다. Atlas에서 properties는 단순한 특성 목록이 아니라,
          realization space를 열어 주는 출발점입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 속성</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Properties는 재배열, 분해, streaming, fusion, recompute,
            residency의 관점에서 정리할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {propertyGroups.map((group) => (
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
          <h2 className="text-xl font-semibold text-white">이 층의 역할</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            property는 "무엇을 바꿀 수 있는가"를 말합니다. 하지만 그것만으로는
            충분하지 않습니다. 실제 변환은 invariant에 의해 제한되고, 최종적으로는
            operator realization과 hardware evidence를 통해 현실적인 실행 경로로
            이어져야 합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roleCards.map((card) => (
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
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            속성은 불변성, 연산자 realization, 실험 분석으로 이어집니다.
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