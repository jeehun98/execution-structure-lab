import { Link, useParams } from "react-router-dom";

import { mode0BaselineObservation } from "../data/hardware/baselineObservations";

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
        이 표는 mode 0 baseline을 해석하는 데 필요한 실행 조건만 남깁니다.
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
          현재 구조에서는 기존 experiments 데이터 디렉터리를 제거했기 때문에,
          detail page는 baseline observation 데이터만 읽습니다.
        </p>

        {experimentId ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-400">
            requested id:{" "}
            <span className="text-neutral-200">{experimentId}</span>
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            to="/hardware-evidence/warp_issue_policy_probe_mode0_baseline"
            className="inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
          >
            mode 0 baseline 상세 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HardwareExperimentDetailPage() {
  const { experimentId } = useParams();

  const observation =
    experimentId === mode0BaselineObservation.id
      ? mode0BaselineObservation
      : null;

  if (!observation) {
    return <NotFoundDetailPage experimentId={experimentId} />;
  }

  const anchorItems = [
    { href: "#overview", label: "실험 개요" },
    { href: "#key-findings", label: "핵심 관찰값" },
    { href: "#condition", label: "실험 조건" },
    { href: "#records", label: "raw records" },
    { href: "#interpretation", label: "해석 가능 범위" },
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
            <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
              Baseline Probe
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
              Experimental Record
            </span>

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

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Reading Rule
            </div>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              이 페이지는 하드웨어 일반론을 설명하지 않는다. 실험 조건, 출력값,
              관찰 가능한 차이, 그리고 단정할 수 없는 범위를 분리해서 기록한다.
            </p>
          </div>
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
              <Link
                to={`/hardware-evidence/${mode0BaselineObservation.id}`}
                className="block rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm text-lime-200 transition hover:bg-lime-400/15"
              >
                {mode0BaselineObservation.label}
              </Link>

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-neutral-500">
                기존 experiments 디렉터리를 제거한 상태이므로, 추가 probe는 별도
                data 파일을 만든 뒤 이 페이지에 연결해야 합니다.
              </div>
            </div>
          </SidebarCard>
        </aside>

        <div className="space-y-6">
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
            desc="mode 0 baseline 이후 바로 이어서 확인할 실험입니다."
          >
            <NextStepBlock nextStep={observation.nextStep} />
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}