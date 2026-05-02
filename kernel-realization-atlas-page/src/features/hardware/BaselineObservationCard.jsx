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

function ConfigPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-neutral-200">{value}</div>
    </div>
  );
}

function RecordTable({ records = [] }) {
  if (!hasItems(records)) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/25">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[80px_1fr_120px_160px_80px] border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
          <div>Warp</div>
          <div>Role</div>
          <div className="text-right">Progress</div>
          <div className="text-right">Last Clock</div>
          <div className="text-right">Sink</div>
        </div>

        <div className="divide-y divide-white/10">
          {records.map((record) => (
            <div
              key={record.warpId}
              className="grid grid-cols-[80px_1fr_120px_160px_80px] px-4 py-3 text-sm text-neutral-300"
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
    </div>
  );
}

function BulletList({ items = [], markerClassName = "bg-lime-400/70" }) {
  if (!hasItems(items)) return null;

  return (
    <ul className="space-y-2 text-sm leading-6 text-neutral-400">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span
            className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${markerClassName}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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

function ProbeContextMiniBlock({ context }) {
  if (!context) return null;

  return (
    <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-lime-300/90">
        Probe Question
      </div>

      <h3 className="mt-2 text-base font-semibold text-white">
        {context.title}
      </h3>

      {context.body ? (
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          {context.body}
        </p>
      ) : null}

      {context.question ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Actual Question
          </div>
          <p className="mt-2 text-sm leading-6 text-lime-100">
            {context.question}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function KnownMechanismMiniGrid({ mechanisms }) {
  const items = mechanisms?.items ?? [];

  if (!hasItems(items)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        Known Mechanisms
      </div>

      <h3 className="mt-2 text-base font-semibold text-white">
        {mechanisms?.title ?? "실험 전에 알고 들어가는 GPU 실행 모델"}
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <div className="text-xs uppercase tracking-[0.14em] text-lime-400/80">
              {item.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonPurposeMiniBlock({ comparisonPurpose }) {
  if (!comparisonPurpose) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        Comparison Purpose
      </div>

      <h3 className="mt-2 text-base font-semibold text-white">
        {comparisonPurpose.title}
      </h3>

      {comparisonPurpose.summary ? (
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {comparisonPurpose.summary}
        </p>
      ) : null}

      <div className="mt-4">
        <BulletList items={comparisonPurpose.examples} />
      </div>
    </div>
  );
}

export default function BaselineObservationCard({ observation }) {
  if (!observation) return null;

  const { config, records } = observation;

  return (
    <section className="rounded-3xl border border-lime-400/20 bg-lime-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-lime-300/90">
        Current Baseline Result
      </div>

      <div className="mt-3 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-lime-300">
              {observation.label}
            </div>

            <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
              {observation.title}
            </h2>

            {observation.summary ? (
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                {observation.summary}
              </p>
            ) : null}
          </div>

          <ProbeContextMiniBlock context={observation.probeContext} />

          <KnownMechanismMiniGrid mechanisms={observation.knownMechanisms} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ConfigPill label="mode" value={config?.mode} />
            <ConfigPill label="blocks" value={config?.blocks} />
            <ConfigPill
              label="cycle budget"
              value={formatNumber(config?.cycleBudget)}
            />
            <ConfigPill
              label="sample period"
              value={formatNumber(config?.samplePeriod)}
            />
          </div>

          <RecordTable records={records} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">
                결과에서 말할 수 있는 것
              </h3>

              <div className="mt-4">
                <BulletList items={observation.interpretation} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <h3 className="text-base font-semibold text-white">
                과잉해석 금지
              </h3>

              <div className="mt-4">
                <BulletList
                  items={observation.caveats}
                  markerClassName="bg-neutral-500"
                />
              </div>
            </div>
          </div>

          <ComparisonPurposeMiniBlock
            comparisonPurpose={observation.comparisonPurpose}
          />
        </div>

        <aside className="space-y-4">
          {hasItems(observation.notTryingToProve) ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                Not Trying To Prove
              </div>

              <div className="mt-4">
                <BulletList
                  items={observation.notTryingToProve}
                  markerClassName="bg-neutral-500"
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Last Clock Observation
            </div>

            <p className="mt-3 text-sm leading-6 text-neutral-300">
              {observation.clockObservation?.summary}
            </p>

            {hasItems(observation.clockObservation?.values) ? (
              <div className="mt-4">
                <CodeBlock>
                  {observation.clockObservation.values.join("\n")}
                </CodeBlock>
              </div>
            ) : null}

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {observation.clockObservation?.caveat}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-amber-300">
              Suggested Patch
            </div>

            <p className="mt-3 text-sm leading-6 text-neutral-300">
              {observation.suggestedPatch?.title}
            </p>

            {observation.suggestedPatch?.desc ? (
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                {observation.suggestedPatch.desc}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                  Before
                </div>
                <CodeBlock>{observation.suggestedPatch?.before}</CodeBlock>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                  After
                </div>
                <CodeBlock>{observation.suggestedPatch?.after}</CodeBlock>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Next
            </div>

            <h3 className="mt-2 text-base font-semibold text-white">
              {observation.nextStep?.label}
            </h3>

            {observation.nextStep?.desc ? (
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {observation.nextStep.desc}
              </p>
            ) : null}

            <div className="mt-4">
              <CodeBlock>{observation.nextStep?.configText}</CodeBlock>
            </div>

            <div className="mt-4">
              <BulletList items={observation.nextStep?.metrics} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}