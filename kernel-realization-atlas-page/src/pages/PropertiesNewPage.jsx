import { Link } from "react-router-dom";

const propertyGroups = [
  {
    title: "Reordering Properties",
    desc: "computation structure가 내부 계산 순서나 결합 방식을 다시 배치할 수 있게 만드는 성질입니다. associativity, commutativity, partial reordering 가능성은 구조가 어떤 순서 자유도를 가지는지와 연결됩니다.",
  },
  {
    title: "Decomposition Properties",
    desc: "계산 구조를 더 작은 단위, tile, stage로 나눌 수 있게 만드는 성질입니다. block decomposition, staged execution, local summary 형성 가능성은 이 층에서 함께 읽힙니다.",
  },
  {
    title: "Streaming Properties",
    desc: "전체 intermediate를 한 번에 materialize하지 않고도 계산을 진행할 수 있게 만드는 성질입니다. online update, running state 유지, chunked processing 가능성은 streaming 구조와 직접 연결됩니다.",
  },
  {
    title: "Fusion Properties",
    desc: "서로 인접한 계산 구조들을 하나의 realization path로 더 길게 묶을 수 있게 만드는 성질입니다. producer-consumer 연결, epilogue attachment, intermediate elimination 가능성이 여기에 포함됩니다.",
  },
  {
    title: "Rematerialization Properties",
    desc: "중간 결과를 저장하기보다 다시 계산하는 편이 가능하거나 유리한지를 설명하는 성질입니다. 이 성질은 구조가 어떤 intermediate를 본질로 요구하는지, 혹은 생략 가능한지를 가르는 기준이 됩니다.",
  },
  {
    title: "Residency Properties",
    desc: "구조 내부의 데이터나 partial result를 registers, shared memory, cache 같은 on-chip 자원에 머물게 하며 재사용할 수 있는지를 설명하는 성질입니다. locality와 reuse가 가능한 구조일수록 더 강하게 드러납니다.",
  },
];

const structureCards = [
  {
    title: "구조 위에서 변환을 읽는다",
    desc: "properties는 개별 operator 이름보다 먼저, reduction, streaming accumulation, mergeable summary 같은 computation structure가 어떤 변환 여지를 가지는지를 설명합니다.",
  },
  {
    title: "가능성과 경계를 분리한다",
    desc: "property는 무엇이 가능해질 수 있는지를 말하고, invariant는 그 가능성이 어디까지 허용되는지를 제한합니다. Atlas는 이 둘을 섞지 않고 분리해 읽습니다.",
  },
  {
    title: "연산자는 다음 층에서 다시 읽는다",
    desc: "실제 operator는 이 페이지의 주인공이 아니라, 구조적 성질들이 구체적인 realization path로 나타나는 다음 해석 대상입니다.",
  },
];

const structureExamples = [
  {
    title: "Reduction",
    desc: "reordering, tree-style decomposition, blockwise accumulation 같은 변환 가능성을 가질 수 있습니다. 다만 어떤 축약 규칙이 유지되어야 하는지는 다음 invariant 층에서 제한됩니다.",
  },
  {
    title: "Streaming Accumulation",
    desc: "running state를 유지할 수 있다면 streaming property가 강하게 나타납니다. 부분 상태를 이어가며 계산할 수 있는 구조일수록 전체 materialization을 피할 여지가 커집니다.",
  },
  {
    title: "Mergeable Summary",
    desc: "부분 요약을 먼저 만들고 나중에 합칠 수 있다면 decomposition과 fusion 모두 더 유연해집니다. local summary를 형성할 수 있다는 점이 realization space를 넓혀 줍니다.",
  },
];

const nextLinks = [
  {
    title: "공통 계산 구조",
    href: "/computation-structures",
  },
  {
    title: "보존 조건",
    href: "/invariants",
  },
  {
    title: "연산자 실현 구조",
    href: "/operators-new",
  },
];

export default function PropertiesNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Properties
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          계산 구조가 어떤 변환을
          <br className="hidden lg:block" />
          허용하는지를 설명하는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 개별 operator를 다시 분류하지 않습니다. 대신
          computation structure가 어떤 재배열, 분해, streaming, fusion,
          rematerialization, residency 가능성을 가지는지를 정리합니다.
          Atlas에서 properties는 특성 목록이 아니라, realization space를 여는
          구조적 출발점입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 속성</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Properties는 계산 구조가 어떤 방식으로 다시 조직될 수 있는지를
            여섯 방향에서 읽게 해 줍니다.
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
            property는 무엇을 바꿀 수 있는지를 말하지만, 무엇이 항상 허용된다는
            뜻은 아닙니다. structure가 가진 변환 가능성은 invariant에 의해
            제한되고, 이후 operator realization과 hardware evidence를 거치며
            실제 구현 경로로 구체화됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {structureCards.map((card) => (
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
            구조별로 보는 변환 가능성
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            properties는 추상적인 허용 목록이 아니라, 각 computation structure가
            어떤 재구성 여지를 가지는지를 드러내는 해석층입니다.
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
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            계산 구조에서 어떤 변환이 가능한지 본 뒤, 무엇을 보존해야 하는지와
            실제 operator realization에서 이 가능성이 어떻게 구체화되는지를
            이어서 읽는 흐름이 가장 자연스럽습니다.
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