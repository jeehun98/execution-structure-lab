import { Link } from "react-router-dom";

const propertyGroups = [
  {
    title: "Reordering Properties",
    desc: "계산의 의미를 깨뜨리지 않으면서 연산 순서, 결합 순서, 부분 실행 순서를 다시 배치할 수 있게 만드는 성질입니다. 이 층은 어떤 계산이 순서 자유도를 가지는지, 그리고 그 자유도가 어디까지 확장될 수 있는지를 설명합니다.",
  },
  {
    title: "Decomposition Properties",
    desc: "계산을 더 작은 block, tile, stage, local subproblem으로 나눌 수 있게 만드는 성질입니다. 전체 계산을 부분 계산들의 구성으로 다시 조직할 수 있는지가 핵심입니다.",
  },
  {
    title: "Streaming Properties",
    desc: "전체 intermediate를 한 번에 전제하지 않고도 계산을 진행할 수 있게 만드는 성질입니다. 부분 상태만 유지하며 입력을 순차적으로 소비할 수 있는 경우, streaming realization의 여지가 생깁니다.",
  },
  {
    title: "Fusion Properties",
    desc: "인접한 계산 단계를 끊지 않고 하나의 더 긴 실행 경로로 묶을 수 있게 만드는 성질입니다. producer-consumer 연결, intermediate 제거, epilogue attachment 같은 재구성이 이 성질과 연결됩니다.",
  },
  {
    title: "Rematerialization Properties",
    desc: "중간 결과를 저장하지 않고 다시 계산해도 의미나 비용 구조상 허용될 수 있는지를 설명하는 성질입니다. 어떤 intermediate가 반드시 보존되어야 하는지, 어떤 것은 다시 만들어도 되는지를 가르는 기준이 됩니다.",
  },
  {
    title: "Residency Properties",
    desc: "partial result나 working set을 on-chip 자원에 머물게 하며 재사용할 수 있게 만드는 성질입니다. locality, reuse window, temporary state retention 가능성을 읽는 데 사용됩니다.",
  },
];

const principleCards = [
  {
    title: "Property는 구조 분류가 아니다",
    desc: "이 페이지는 계산이 reduction인지 streaming인지 다시 분류하지 않습니다. 이미 주어진 계산 구조 위에서, 무엇을 바꿀 수 있는지와 어떤 realization path가 열리는지를 읽습니다.",
  },
  {
    title: "Property는 가능성을 말한다",
    desc: "property는 어떤 재배치나 재구성이 가능한지를 설명합니다. 그것이 항상 허용된다는 뜻은 아니며, 실제 허용 범위는 invariant와 수치적 조건에 의해 제한됩니다.",
  },
  {
    title: "Property는 realization space를 연다",
    desc: "이 층의 목적은 추상적 특성 나열이 아니라, 가능한 구현 공간을 여는 것입니다. 어떤 계산이 tileable한지, fuseable한지, streamable한지 읽을 수 있어야 다음 단계로 넘어갈 수 있습니다.",
  },
];

const keyQuestions = [
  {
    title: "순서를 바꿔도 되는가",
    desc: "연산의 결합 순서나 처리 순서를 바꾸어도 의미가 유지되는가. 가능하다면 tree reduction, partial accumulation, reordered execution 같은 경로가 열립니다.",
  },
  {
    title: "쪼개서 다시 구성할 수 있는가",
    desc: "계산을 작은 부분 문제들로 분해한 뒤 다시 합쳐도 전체 의미가 유지되는가. 가능하다면 tiling, staged execution, local summary construction이 자연스러워집니다.",
  },
  {
    title: "전체 intermediate 없이 진행 가능한가",
    desc: "모든 중간 결과를 materialize하지 않고도 running state만으로 계산을 이어갈 수 있는가. 가능하다면 streaming path와 memory traffic 절감 가능성이 생깁니다.",
  },
  {
    title: "붙여서 더 긴 실행 경로를 만들 수 있는가",
    desc: "인접한 계산 단계들을 분리하지 않고 직접 연결할 수 있는가. 가능하다면 fusion, epilogue attachment, intermediate elimination이 현실적인 선택지가 됩니다.",
  },
  {
    title: "저장 대신 다시 계산할 수 있는가",
    desc: "중간값을 저장하는 것보다 재계산하는 편이 허용되거나 더 나은가. 가능하다면 rematerialization을 통해 저장 비용을 줄일 수 있습니다.",
  },
  {
    title: "데이터를 가까운 곳에 머물게 할 수 있는가",
    desc: "partial result나 working set을 register, shared memory, cache에 남겨 두고 재사용할 수 있는가. 가능하다면 residency-aware realization이 더 강해집니다.",
  },
];

const realizationCards = [
  {
    title: "Tree / Block Reduction",
    desc: "reordering과 decomposition property가 강한 계산은 전체 축약을 여러 부분 축약으로 나눈 뒤 다시 합치는 realization으로 이어질 수 있습니다.",
  },
  {
    title: "Streaming Update Path",
    desc: "streaming property가 강한 계산은 전체 intermediate를 만들지 않고 running state만 유지하는 online path로 옮겨갈 수 있습니다.",
  },
  {
    title: "Fused Producer-Consumer Path",
    desc: "fusion property가 보이는 계산은 연속된 단계 사이의 intermediate를 제거하고 하나의 더 긴 execution path로 묶는 방식으로 실현될 수 있습니다.",
  },
  {
    title: "On-chip Residency Path",
    desc: "residency property가 강한 계산은 partial result를 더 오래 on-chip에 머물게 하며 local reuse를 극대화하는 realization을 가질 수 있습니다.",
  },
];

const boundaryCards = [
  {
    title: "모든 가능성은 자동으로 합법이 아니다",
    desc: "property가 있다고 해서 임의의 재배치나 융합이 항상 성립하는 것은 아닙니다. 실제 적용 가능 범위는 의미 보존, 수치 안정성, 허용 오차, dependency 구조에 의해 제한됩니다.",
  },
  {
    title: "Property와 Invariant는 같은 층이 아니다",
    desc: "property는 무엇을 바꿀 수 있는지를 말하고, invariant는 바꾼 뒤에도 무엇이 유지되어야 하는지를 말합니다. 둘을 섞으면 페이지의 역할이 흐려집니다.",
  },
  {
    title: "실제 실현은 Hardware와 Operator에서 닫힌다",
    desc: "property는 구현 공간을 열지만, 어떤 경로가 실제로 채택되는지는 operator profile과 hardware evidence를 통해 결정됩니다. 이 페이지는 그 이전 단계까지를 다룹니다.",
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
          계산이 어떤 변환을
          <br className="hidden lg:block" />
          허용하는지를 읽는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 계산 구조를 다시 분류하지 않습니다. 대신 이미 주어진 계산이
          어떤 재배열, 분해, streaming, fusion, rematerialization, residency
          가능성을 가지는지를 정리합니다. Atlas에서 property는 특성 목록이
          아니라, 어떤 realization space가 열리는지를 설명하는 구조적 조건의 층입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 속성</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Properties는 계산이 어떤 방식으로 다시 조직될 수 있는지를 여섯
            방향에서 읽게 해 줍니다.
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
          <h2 className="text-xl font-semibold text-white">이 층을 어떻게 읽어야 하는가</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            Property는 계산의 이름을 다시 붙이는 층이 아니라, 그 계산이 어떤
            변환 질문들에 대해 예 또는 아니오를 줄 수 있는지를 정리하는 층입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {principleCards.map((card) => (
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
          <h2 className="text-xl font-semibold text-white">Property가 답하는 질문들</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            이 페이지의 중심은 구조 이름이 아니라 변환 질문입니다. 계산을
            만났을 때, 아래 질문들에 답할 수 있어야 realization 방향이 보이기
            시작합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {keyQuestions.map((item) => (
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
          <h2 className="text-xl font-semibold text-white">대표적 실현 방향</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            Property는 구현을 직접 결정하지는 않지만, 어떤 종류의 realization이
            가능해지는지는 미리 드러낼 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {realizationCards.map((item) => (
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
          <h2 className="text-xl font-semibold text-white">경계와 연결</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Property는 가능성을 여는 층이지만, 그 가능성은 이후 invariant,
            operator profile, hardware evidence를 거치며 더 좁아지고 구체화됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {boundaryCards.map((item) => (
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
          <h2 className="text-xl font-semibold text-white">이 층의 원리</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Atlas에서 property는 왜 바꿔도 되는가를 설명하고, transform이나
            realization은 실제로 무엇을 어떻게 바꾸는가를 설명합니다. 이 구분이
            유지되어야 전체 계층이 흔들리지 않습니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            계산 구조를 본 뒤, property에서 변환 가능성을 읽고, invariant에서
            보존 조건을 확인한 다음, operator realization에서 실제 실현 경로를
            보는 흐름이 가장 자연스럽습니다.
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