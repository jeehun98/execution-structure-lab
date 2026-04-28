import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { hardwareChips } from "../data/hardware/chips";
import { hardwareOverview } from "../data/hardware/overview";
import {
  hardwareExperimentGroups,
  hardwareExperimentsIntro,
} from "../data/hardware/experiments";

function StatPill({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>

      {desc ? (
        <p className="mt-3 max-w-4xl text-sm leading-7 text-neutral-400">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function ReadingStepCard({ index, title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-sm font-semibold text-lime-300">
          {index}
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-lime-400/50 bg-lime-400/10"
          : "border-white/10 bg-white/[0.03] hover:border-lime-400/30 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Probe Group
          </div>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {group.label}
          </h3>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-300">
          {group.experiments?.length ?? 0}
        </div>
      </div>

      {group.summary ? (
        <p className="mt-4 line-clamp-4 text-sm leading-6 text-neutral-400">
          {group.summary}
        </p>
      ) : null}
    </button>
  );
}

function SignalChips({ items = [] }) {
  if (!items?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-neutral-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompactList({ title, items = [] }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h4 className="text-sm font-semibold text-white">{title}</h4>

      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-400">
        {items.slice(0, 4).map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExperimentCard({ experiment }) {
  const signals =
    experiment.observe?.slice(0, 3) ??
    experiment.outputs?.slice(0, 3) ??
    experiment.resultHighlights?.slice(0, 3) ??
    [];

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-lime-400/30 hover:bg-white/[0.055]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
          {experiment.category}
        </span>

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
          Probe
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">
        {experiment.label}
      </h3>

      {experiment.summary ? (
        <p className="mt-3 text-sm leading-7 text-neutral-400">
          {experiment.summary}
        </p>
      ) : null}

      {experiment.question ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Question
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            {experiment.question}
          </p>
        </div>
      ) : null}

      {signals?.length ? (
        <div className="mt-5">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Signals to read
          </div>
          <SignalChips items={signals} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/hardware-evidence/${experiment.id}`}
          className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 보기
        </Link>

        {experiment.nextLinks?.[0]?.href ? (
          <Link
            to={experiment.nextLinks[0].href}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/30 hover:text-white"
          >
            다음 검증 경로
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function SelectedGroupOverview({ group }) {
  if (!group) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            Selected Probe Group
          </div>

          <h2 className="mt-3 text-3xl font-semibold text-white">
            {group.headline || group.label}
          </h2>

          {group.summary ? (
            <p className="mt-4 max-w-4xl text-sm leading-7 text-neutral-400">
              {group.summary}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-right">
          <div className="text-3xl font-semibold text-white">
            {group.experiments?.length ?? 0}
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Probes
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <CompactList title="이 분류가 묻는 질문" items={group.questions} />
        <CompactList title="주요 반응 신호" items={group.signals} />
        <CompactList title="해석 기준" items={group.interpretationGuide} />
      </div>
    </div>
  );
}

export default function HardwareEvidencePage() {
  const [selectedGroupId, setSelectedGroupId] = useState(
    hardwareExperimentGroups[0]?.id ?? null
  );

  const selectedGroup = useMemo(() => {
    return (
      hardwareExperimentGroups.find((group) => group.id === selectedGroupId) ??
      hardwareExperimentGroups[0] ??
      null
    );
  }, [selectedGroupId]);

  return (
    <div className="space-y-16">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          {hardwareOverview.eyebrow}
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          {hardwareOverview.title}
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 GPU 성능 점수를 모아두는 곳이 아닙니다. 각 probe는 하나의
          커널 구조를 GPU에 입력하고, 그 실행 반응에서 memory layout, cache
          reuse, bank conflict, work collapse 같은 하드웨어 단서를 읽기 위한
          실험입니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {hardwareChips.map((chip) => (
            <StatPill key={chip}>{chip}</StatPill>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="How to read"
          title="Probe는 benchmark가 아니라 질문을 가진 커널입니다"
          desc="메인 페이지에서는 전체 지도를 먼저 보여줍니다. 개별 실험의 코드, 그래프, 결과 해석은 상세 페이지에서 확인하고, 여기서는 각 probe가 어떤 하드웨어 층위를 건드리는지 빠르게 파악합니다."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <ReadingStepCard
            index="1"
            title="무엇을 바꾸는가"
            desc="stride, padding, work size, address pattern처럼 실험에서 흔드는 변수를 먼저 봅니다."
          />

          <ReadingStepCard
            index="2"
            title="무엇을 고정하는가"
            desc="total work, thread shape, memory size, iteration count처럼 비교 기준을 고정합니다."
          />

          <ReadingStepCard
            index="3"
            title="어떤 반응이 드러나는가"
            desc="latency spike, throughput drop, work collapse, conflict, reuse 같은 신호를 읽습니다."
          />

          <ReadingStepCard
            index="4"
            title="무엇을 단정하면 안 되는가"
            desc="단일 결과를 하드웨어 원리로 과잉해석하지 않고, 후속 probe로 검증합니다."
          />
        </div>
      </section>

      {hardwareExperimentsIntro ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            Probe Atlas
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            {hardwareExperimentsIntro.title}
          </h2>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-neutral-400">
            {hardwareExperimentsIntro.desc}
          </p>
        </section>
      ) : null}

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Probe Groups"
          title="먼저 하드웨어 층위를 고릅니다"
          desc="각 그룹은 하나의 하드웨어 질문 묶음입니다. Global Memory, Shared Memory, Occupancy, Control Flow처럼 서로 다른 실행 층위를 나누어 보고, 그 안에서 개별 probe를 배치합니다."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {hardwareExperimentGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              active={group.id === selectedGroup?.id}
              onClick={() => setSelectedGroupId(group.id)}
            />
          ))}
        </div>
      </section>

      {selectedGroup ? (
        <section className="space-y-6">
          <SelectedGroupOverview group={selectedGroup} />

          <div className="space-y-4">
            <SectionHeader
              eyebrow="Experiments"
              title={`${selectedGroup.label} probes`}
              desc="메인에서는 각 실험의 질문과 관찰 신호만 보여줍니다. 커널 코드, 그래프, 결과 해석, caveat는 상세 페이지로 분리하는 구조가 읽기 쉽습니다."
            />

            <div className="grid gap-5 lg:grid-cols-2">
              {selectedGroup.experiments?.map((experiment) => (
                <ExperimentCard key={experiment.id} experiment={experiment} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            From Evidence to Realization
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            이 증거가 realization 선택으로 이어지는 방식
          </h2>

          <p className="mt-4 text-sm leading-7 text-neutral-400">
            하드웨어 probe는 결과 보관소가 아니라, 커널 합성기가 realization을
            선택할 때 참조하는 경험적 근거입니다. 특정 stride에서 spike가
            생기는지, padding으로 완화되는지, fixed-work 조건에서도 비용이
            유지되는지, register pressure가 어느 지점에서 occupancy를 무너뜨리는지
            같은 관찰은 이후 layout transformation, tiling, vectorization, shared
            memory 사용 여부, compiler lowering 검증으로 연결됩니다.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            Next
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">다음 경로</h2>

          <div className="mt-5 space-y-3 text-sm">
            <Link
              to="/properties-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              변환 성질 보기
            </Link>

            <Link
              to="/operators-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              연산자 실현 구조 보기
            </Link>

            <Link
              to="/analysis-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              실현 비교 실험 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}