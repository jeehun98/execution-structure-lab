import { Link } from "react-router-dom";

function InfoSection({ title, children, tone = "neutral" }) {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.03]",
    lime: "border-lime-400/20 bg-lime-400/[0.06]",
    sky: "border-sky-400/20 bg-sky-400/[0.05]",
    amber: "border-amber-400/20 bg-amber-400/[0.05]",
  }[tone];

  const titleClass = {
    neutral: "text-neutral-500",
    lime: "text-lime-300/80",
    sky: "text-sky-300/80",
    amber: "text-amber-300/80",
  }[tone];

  return (
    <section className={`mt-5 rounded-2xl border p-4 ${toneClass}`}>
      <div className={`text-xs uppercase tracking-[0.16em] ${titleClass}`}>
        {title}
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}

function BuildUpBlock({ buildUp }) {
  if (!Array.isArray(buildUp) || buildUp.length === 0) {
    return null;
  }

  return (
    <InfoSection title="Build-up Flow" tone="sky">
      <ol className="space-y-3">
        {buildUp.map((item, index) => {
          if (!item) return null;

          const id = item.id;
          const label = item.label ?? item.title ?? item.id;
          const summary = item.summary ?? item.reason;

          return (
            <li
              key={id ?? `${label}-${index}`}
              className="rounded-xl border border-white/10 bg-black/25 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 text-[11px] font-semibold text-sky-200">
                  {index + 1}
                </span>

                <div>
                  <div className="text-xs font-semibold text-sky-200">
                    {label}
                  </div>

                  {summary ? (
                    <p className="mt-2 text-xs leading-6 text-neutral-400">
                      {summary}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </InfoSection>
  );
}

function GraphSummaryBlock({ graphSummary }) {
  if (!graphSummary) return null;

  return (
    <>
      {graphSummary.intro ? (
        <InfoSection title="Brief" tone="lime">
          <p className="text-sm leading-7 text-neutral-200">
            {graphSummary.intro}
          </p>
        </InfoSection>
      ) : null}

      <BuildUpBlock buildUp={graphSummary.buildUp} />

      {graphSummary.roleInFlow ? (
        <InfoSection title="Role in Flow">
          <p className="text-sm leading-7 text-neutral-300">
            {graphSummary.roleInFlow}
          </p>
        </InfoSection>
      ) : null}

      {graphSummary.keyTakeaway ? (
        <InfoSection title="Key Point" tone="amber">
          <p className="text-sm leading-7 text-neutral-300">
            {graphSummary.keyTakeaway}
          </p>
        </InfoSection>
      ) : null}

      {graphSummary.nextQuestion ? (
        <InfoSection title="Next Question">
          <p className="text-sm leading-7 text-neutral-400">
            {graphSummary.nextQuestion}
          </p>
        </InfoSection>
      ) : null}
    </>
  );
}

function RelatedNodesBlock({ relatedNodes }) {
  if (!Array.isArray(relatedNodes) || relatedNodes.length === 0) {
    return null;
  }

  return (
    <InfoSection title="Related Context" tone="sky">
      <div className="space-y-3">
        {relatedNodes.map((relatedNode, index) => {
          const id =
            typeof relatedNode === "string" ? relatedNode : relatedNode.id;

          const reason =
            typeof relatedNode === "string" ? null : relatedNode.reason;

          if (!id) return null;

          return (
            <div
              key={`${id}-${index}`}
              className="rounded-xl border border-white/10 bg-black/25 px-4 py-3"
            >
              <div className="text-xs font-semibold text-sky-200">
                {id}
              </div>

              {reason ? (
                <p className="mt-2 text-xs leading-5 text-neutral-400">
                  {reason}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </InfoSection>
  );
}

function ProbingMeaningBlock({ probingMeaning }) {
  if (!probingMeaning) return null;

  return (
    <InfoSection title="Probing Meaning">
      <p className="text-xs leading-6 text-neutral-400">
        {probingMeaning}
      </p>
    </InfoSection>
  );
}

function FallbackSummaryBlock({ description, probingMeaning }) {
  return (
    <>
      {description ? (
        <InfoSection title="Brief" tone="lime">
          <p className="text-sm leading-7 text-neutral-300">
            {description}
          </p>
        </InfoSection>
      ) : (
        <InfoSection title="Brief">
          <p className="text-sm leading-7 text-neutral-600">
            graphSummary 또는 description이 등록되지 않았습니다.
          </p>
        </InfoSection>
      )}

      <ProbingMeaningBlock probingMeaning={probingMeaning} />
    </>
  );
}

export default function GraphPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <div>
        <p className="text-sm text-neutral-400">
          노드를 선택하면 연구 흐름과 연결 관계가 표시됩니다.
        </p>
      </div>
    );
  }

  const title = selectedNode.title ?? selectedNode.label;
  const label = selectedNode.label;
  const description = selectedNode.description;
  const status = selectedNode.status;
  const kind = selectedNode.kind;
  const layer = selectedNode.layer;
  const detailPath = selectedNode.detailPath;
  const graphSummary = selectedNode.graphSummary;
  const relatedNodes = selectedNode.relatedNodes;
  const probingMeaning = selectedNode.probingMeaning;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {kind ? (
          <div className="inline-flex rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
            {kind}
          </div>
        ) : null}

        {layer ? (
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-neutral-400">
            {layer}
          </div>
        ) : null}
      </div>

      {label ? (
        <div className="mt-5 text-xs uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </div>
      ) : null}

      <h2 className="mt-2 text-xl font-semibold leading-8 text-white">
        {title}
      </h2>

      {graphSummary ? (
        <GraphSummaryBlock graphSummary={graphSummary} />
      ) : (
        <FallbackSummaryBlock
          description={description}
          probingMeaning={probingMeaning}
        />
      )}

      {status ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
          status:{" "}
          <span className="text-lime-300">
            {status}
          </span>
        </div>
      ) : null}

      <RelatedNodesBlock relatedNodes={relatedNodes} />

      {detailPath ? (
        <Link
          to={detailPath}
          className="mt-6 inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 실험 보기 →
        </Link>
      ) : null}
    </div>
  );
}