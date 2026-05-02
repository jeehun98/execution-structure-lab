import { Link, useParams } from "react-router-dom";

import {
  findHardwareObservationById,
  hardwareObservations,
} from "../data/hardware/observations";

function formatNumber(value) {
  if (value === null || value === undefined) return "—";

  if (typeof value !== "number") {
    return String(value);
  }

  return value.toLocaleString("en-US");
}

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function SectionBlock({ id, eyebrow, title, desc, children }) {
  if (!children) return null;

  return (
    <section
      id={id}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      {(eyebrow || title || desc) && (
        <div>
          {eyebrow ? (
            <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
              {eyebrow}
            </div>
          ) : null}

          {title ? (
            <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
          ) : null}

          {desc ? (
            <p className="mt-3 text-sm leading-6 text-neutral-400">{desc}</p>
          ) : null}
        </div>
      )}

      <div className={title || desc || eyebrow ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

function SidebarCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AnchorNav({ items = [] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function DetailList({ title, items = [], markerClassName = "bg-lime-400/70" }) {
  if (!hasItems(items)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <ul className="mt-4 space-y-3 text-sm text-neutral-300">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-6"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${markerClassName}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoCardGrid({ items = [] }) {
  if (!hasItems(items)) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-lime-400/80">
            {item.label}
          </div>

          <p className="mt-3 text-sm leading-6 text-neutral-300">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProbeContextBlock({ context }) {
  if (!context) return null;

  return (
    <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] p-6">
      <h3 className="text-lg font-semibold text-white">{context.title}</h3>

      {context.body ? (
        <p className="mt-3 text-sm leading-7 text-neutral-300">
          {context.body}
        </p>
      ) : null}

      {context.question ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Actual Question
          </div>

          <p className="mt-3 text-sm leading-7 text-lime-100">
            {context.question}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ComparisonPurposeBlock({ comparisonPurpose }) {
  if (!comparisonPurpose) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">
        {comparisonPurpose.title}
      </h3>

      {comparisonPurpose.summary ? (
        <p className="mt-3 text-sm leading-7 text-neutral-400">
          {comparisonPurpose.summary}
        </p>
      ) : null}

      <div className="mt-5">
        <DetailList title="비교 해석 예시" items={comparisonPurpose.examples} />
      </div>
    </div>
  );
}

function KeyFindingGrid({ observation }) {
  const records = observation.records ?? [];
  const progressValues = records.map((record) => record.progress);
  const lastClockValues = records.map((record) => record.lastClock);
  const sinkValues = records.map((record) => record.sink);

  const allProgressEqual =
    progressValues.length > 0 &&
    progressValues.every((value) => value === progressValues[0]);

  const clockDeltas = lastClockValues.slice(1).map((value, index) => {
    return value - lastClockValues[index];
  });

  const allClockDeltasEqual =
    clockDeltas.length > 0 &&
    clockDeltas.every((value) => value === clockDeltas[0]);

  const allSinkZero =
    sinkValues.length > 0 && sinkValues.every((value) => value === 0);

  const items = [
    {
      label: "Warp Count",
      value: records.length,
      desc: "동일 조건에서 기록된 warp 수",
    },
    {
      label: "Progress",
      value: allProgressEqual ? formatNumber(progressValues[0]) : "mixed",
      desc: allProgressEqual
        ? "모든 warp의 progress가 동일"
        : "warp별 progress 차이 존재",
    },
    {
      label: "Clock Delta",
      value: allClockDeltasEqual ? `+${clockDeltas[0]} cycles` : "mixed",
      desc: allClockDeltasEqual
        ? "last_clock이 고정 간격으로 증가"
        : "last_clock 간격이 일정하지 않음",
    },
    {
      label: "Sink",
      value: allSinkZero ? "all zero" : "non-zero",
      desc: allSinkZero
        ? "anti-optimization 관점에서 개선 필요"
        : "sink가 0으로 고정되지 않음",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            {item.label}
          </div>

          <div className="mt-3 text-xl font-semibold leading-tight text-white">
            {item.value}
          </div>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

function ConfigTable({ config }) {
  if (!config) return null;

  const entries = [
    ["mode", config.mode],
    ["blocks", config.blocks],
    ["cycle_budget", config.cycleBudget],
    ["sample_period", config.samplePeriod],
    ["global_elements", config.globalElements],
  ].filter(([, value]) => value !== undefined && value !== null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">실험 조건</h3>

      <p className="mt-3 text-sm leading-6 text-neutral-400">
        이 표는 해당 probe를 해석하는 데 필요한 실행 조건만 남깁니다.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/10">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-2 px-4 py-4 md:grid-cols-[180px_minmax(0,1fr)]"
            >
              <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                {key}
              </div>

              <div className="text-sm leading-6 text-neutral-300 tabular-nums">
                {formatNumber(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordTable({ records = [] }) {
  if (!hasItems(records)) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
      <div className="grid min-w-[720px] grid-cols-[90px_1fr_140px_190px_90px] border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
        <div>Warp</div>
        <div>Role</div>
        <div className="text-right">Progress</div>
        <div className="text-right">Last Clock</div>
        <div className="text-right">Sink</div>
      </div>

      <div className="min-w-[720px] divide-y divide-white/10">
        {records.map((record) => (
          <div
            key={record.warpId}
            className="grid grid-cols-[90px_1fr_140px_190px_90px] px-4 py-3 text-sm text-neutral-300"
          >
            <div>warp {record.warpId}</div>

            <div>{record.role}</div>

            <div className="text-right tabular-nums">
              {formatNumber(record.progress)}
            </div>

            <div className="text-right tabular-nums">
              {formatNumber(record.lastClock)}
            </div>

            <div className="text-right tabular-nums">{record.sink}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeBlock({ children }) {
  if (!children) return null;

  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-neutral-200">
      <code>{children}</code>
    </pre>
  );
}

function PatchBlock({ patch }) {
  if (!patch) return null;

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-amber-300">
        Suggested Patch
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">{patch.title}</h3>

      {patch.desc ? (
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          {patch.desc}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
            Before
          </div>
          <CodeBlock>{patch.before}</CodeBlock>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
            After
          </div>
          <CodeBlock>{patch.after}</CodeBlock>
        </div>
      </div>
    </div>
  );
}

function NextStepBlock({ nextStep }) {
  if (!nextStep) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        Next Probe
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        {nextStep.label}
      </h3>

      {nextStep.desc ? (
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {nextStep.desc}
        </p>
      ) : null}

      <div className="mt-5">
        <CodeBlock>{nextStep.configText}</CodeBlock>
      </div>

      <div className="mt-5">
        <DetailList title="다음에 볼 지표" items={nextStep.metrics} />
      </div>
    </div>
  );
}

function NotFoundDetailPage({ experimentId }) {
  const firstObservation = hardwareObservations[0];

  return (
    <div className="space-y-6">
      <Link
        to="/hardware-evidence"
        className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
      >
        ← Hardware Evidence
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
          No Detail Record
        </div>

        <h1 className="mt-3 text-2xl font-semibold text-white">
          등록된 hardware probe 상세 기록이 없습니다
        </h1>

        <p className="mt-4 text-sm leading-7 text-neutral-400">
          요청한 id와 일치하는 observation을 찾지 못했습니다. 현재 등록된
          observation 목록에서 다시 선택하세요.
        </p>

        {experimentId ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-400">
            requested id:{" "}
            <span className="text-neutral-200">{experimentId}</span>
          </div>
        ) : null}

        {firstObservation ? (
          <div className="mt-6">
            <Link
              to={`/hardware-evidence/${firstObservation.id}`}
              className="inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
            >
              첫 번째 observation 보기
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function HardwareExperimentDetailPage() {
  const { experimentId } = useParams();

  const observation = findHardwareObservationById(experimentId);

  if (!observation) {
    return <NotFoundDetailPage experimentId={experimentId} />;
  }

  const anchorItems = [
    { href: "#overview", label: "실험 개요" },
    { href: "#probe-context", label: "probe 질문" },
    { href: "#known-mechanisms", label: "알고 들어가는 실행 모델" },
    { href: "#not-proving", label: "증명하지 않는 것" },
    { href: "#key-findings", label: "핵심 관찰값" },
    { href: "#condition", label: "실험 조건" },
    { href: "#records", label: "raw records" },
    { href: "#interpretation", label: "해석 가능 범위" },
    { href: "#comparison", label: "후속 mode 비교" },
    { href: "#clock", label: "last_clock 해석" },
    { href: "#patch", label: "sink patch" },
    { href: "#next", label: "다음 probe" },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <Link
          to="/hardware-evidence"
          className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          ← Hardware Evidence
        </Link>

        <div
          id="overview"
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="flex flex-wrap gap-2">
            {observation.groupLabel ? (
              <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
                {observation.groupLabel}
              </span>
            ) : null}

            {observation.type ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
                {observation.type}
              </span>
            ) : null}

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
              {observation.label}
            </span>
          </div>

          <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            {observation.title}
          </h1>

          {observation.summary ? (
            <p className="mt-4 max-w-4xl text-base leading-8 text-neutral-400">
              {observation.summary}
            </p>
          ) : null}
        </div>

        <section id="key-findings">
          <KeyFindingGrid observation={observation} />
        </section>
      </section>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SidebarCard title="이 페이지에서 확인할 것">
            <AnchorNav items={anchorItems} />
          </SidebarCard>

          <SidebarCard title="현재 등록된 상세 기록">
            <div className="space-y-3">
              {hardwareObservations.map((item) => {
                const isActive = item.id === observation.id;

                return (
                  <Link
                    key={item.id}
                    to={`/hardware-evidence/${item.id}`}
                    className={`block rounded-xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-lime-400/30 bg-lime-400/10 text-lime-200 hover:bg-lime-400/15"
                        : "border-white/10 bg-black/20 text-neutral-300 hover:border-lime-400/40 hover:text-white"
                    }`}
                  >
                    <div className="font-medium">{item.label}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {item.groupLabel}
                    </div>
                  </Link>
                );
              })}
            </div>
          </SidebarCard>
        </aside>

        <div className="space-y-6">
          <SectionBlock
            id="probe-context"
            eyebrow="Probe Question"
            title="이 실험이 실제로 묻는 것"
            desc="자명한 CUDA 실행 모델이 아니라, workload class 차이가 progress 분포에 어떻게 드러나는지를 본다."
          >
            <ProbeContextBlock context={observation.probeContext} />
          </SectionBlock>

          <SectionBlock
            id="known-mechanisms"
            eyebrow="Known Mechanisms"
            title={
              observation.knownMechanisms?.title ??
              "실험 전에 알고 들어가는 GPU 실행 모델"
            }
            desc="이 섹션은 실험으로 새로 증명하는 내용이 아니라, 결과 해석 전에 전제로 두는 GPU 실행 모델입니다."
          >
            <InfoCardGrid items={observation.knownMechanisms?.items} />
          </SectionBlock>

          <SectionBlock
            id="not-proving"
            eyebrow="Boundary"
            title="이 실험이 직접 증명하지 않는 것"
            desc="progress 차이는 scheduler, dependency, memory latency, compiler scheduling, occupancy가 합쳐진 관찰값입니다."
          >
            <DetailList
              title="단정하지 않을 내용"
              items={observation.notTryingToProve}
              markerClassName="bg-neutral-500"
            />
          </SectionBlock>

          <SectionBlock
            id="condition"
            eyebrow="Condition"
            title="실험 조건"
            desc="후속 mode와 비교하기 위한 baseline 실행 조건입니다."
          >
            <ConfigTable config={observation.config} />
          </SectionBlock>

          <SectionBlock
            id="records"
            eyebrow="Raw Records"
            title="warp별 관찰값"
            desc="progress, last_clock, sink를 warp별로 분리해 기록합니다."
          >
            <div className="overflow-x-auto">
              <RecordTable records={observation.records} />
            </div>
          </SectionBlock>

          <div id="interpretation" className="grid gap-6 lg:grid-cols-2">
            <DetailList
              title="결과에서 말할 수 있는 것"
              items={observation.interpretation}
            />

            <DetailList
              title="단정하면 안 되는 것"
              items={observation.caveats}
              markerClassName="bg-neutral-500"
            />
          </div>

          <SectionBlock
            id="comparison"
            eyebrow="Comparison"
            title="후속 mode와 비교하는 방식"
            desc="mode 0은 발견용 결과라기보다 mode 1~4 해석을 위한 기준선입니다."
          >
            <ComparisonPurposeBlock
              comparisonPurpose={observation.comparisonPurpose}
            />
          </SectionBlock>

          <SectionBlock
            id="clock"
            eyebrow="Clock Observation"
            title="last_clock 해석"
            desc="마지막 기록 시점에서 관찰된 clock order를 분리해서 기록합니다."
          >
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm leading-6 text-neutral-300">
                {observation.clockObservation?.summary}
              </p>

              {hasItems(observation.clockObservation?.values) ? (
                <div className="mt-4">
                  <CodeBlock>
                    {observation.clockObservation.values.join("\n")}
                  </CodeBlock>
                </div>
              ) : null}

              {observation.clockObservation?.caveat ? (
                <p className="mt-4 text-sm leading-6 text-neutral-500">
                  {observation.clockObservation.caveat}
                </p>
              ) : null}
            </div>
          </SectionBlock>

          <SectionBlock
            id="patch"
            eyebrow="Anti-optimization"
            title="sink cancellation 개선"
            desc="sink가 0으로 고정되는 문제를 줄이기 위한 수정 후보입니다."
          >
            <PatchBlock patch={observation.suggestedPatch} />
          </SectionBlock>

          <SectionBlock
            id="next"
            eyebrow="Next"
            title="다음 검증"
            desc="현재 observation 이후 바로 이어서 확인할 실험입니다."
          >
            <NextStepBlock nextStep={observation.nextStep} />
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}