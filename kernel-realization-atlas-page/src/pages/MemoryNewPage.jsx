import { Link } from "react-router-dom";

const memoryViews = [
  {
    title: "Memory as Hardware Constraint",
    desc: "메모리는 단순 저장 공간이 아니라 realization quality를 크게 바꾸는 하드웨어 제약입니다. bandwidth, latency, cache behavior, shared memory 구조가 여기에 포함됩니다.",
  },
  {
    title: "Memory as Optimization Target",
    desc: "많은 최적화는 연산량 자체보다 memory traffic, intermediate materialization, reuse 구조를 바꾸는 데서 성능 차이를 만듭니다.",
  },
  {
    title: "Memory as Realization Lens",
    desc: "같은 operator라도 어떤 데이터를 남기고, 어떤 데이터를 재사용하고, 무엇을 다시 계산하는지에 따라 전혀 다른 realization path가 형성됩니다.",
  },
];

const methodGroups = [
  {
    title: "Streaming",
    desc: "전체 intermediate를 물질화하지 않고 순차적으로 상태를 갱신하며 처리하는 방식입니다.",
  },
  {
    title: "Rematerialization",
    desc: "중간 결과를 저장하는 대신 다시 계산하여 memory traffic과 저장 비용을 줄이는 방식입니다.",
  },
  {
    title: "Residency",
    desc: "데이터를 registers, shared memory, cache 같은 on-chip 자원에 오래 머물게 하며 재사용하는 방식입니다.",
  },
  {
    title: "Fusion",
    desc: "연산 경계를 줄여 intermediate write/read를 없애고 locality를 높이는 방식입니다.",
  },
  {
    title: "Tiling",
    desc: "연산과 데이터를 작은 블록으로 나누어 local reuse를 만들고 memory movement를 줄이는 방식입니다.",
  },
  {
    title: "Traffic Elimination",
    desc: "불필요한 load/store, redundant movement, full materialization을 제거하는 방향으로 realization을 바꾸는 방식입니다.",
  },
];

const connectedLinks = [
  {
    title: "하드웨어 증거 보기",
    href: "/hardware-evidence",
  },
  {
    title: "최적화 의미 체계",
    href: "/properties-new",
  },
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

export default function MemoryNewPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Memory Lens
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          Atlas 전체를 가로지르는 메모리 중심 해석 렌즈
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 메모리를 독립된 한 카테고리로 보기보다, Atlas 전체를
          가로지르는 해석 관점으로 다룹니다. 많은 realization 차이는 연산 의미
          자체보다 memory movement, reuse, residency, materialization 방식의
          차이에서 발생합니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">메모리를 보는 세 관점</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Memory는 제약이면서 동시에 최적화 대상이고, realization을 읽는 렌즈이기도 합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {memoryViews.map((view) => (
            <div
              key={view.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{view.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {view.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 메모리 방법론</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Atlas에서 메모리 중심 해석은 몇 가지 반복되는 realization 패턴으로 정리할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {methodGroups.map((group) => (
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
          <h2 className="text-xl font-semibold text-white">이 렌즈의 역할</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            Memory는 Hardware Evidence에서는 계층 구조와 접근 비용으로 나타나고,
            Properties에서는 streaming, rematerialization, residency 같은 변환
            가능성으로 나타나며, Invariants에서는 어떤 저장과 재계산이 허용되는지의
            조건으로 나타납니다. Operators와 Analysis에서는 각 realization이 실제로
            어떤 traffic과 reuse 구조를 만드는지를 읽는 기준이 됩니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">연결된 층위</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            메모리 중심 해석은 Atlas의 모든 주요 카테고리와 연결됩니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {connectedLinks.map((link) => (
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