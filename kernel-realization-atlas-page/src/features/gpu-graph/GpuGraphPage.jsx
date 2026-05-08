import { useState } from "react";
import GraphCanvas from "./GraphCanvas";
import GraphPanel from "./GraphPanel";

export default function GpuGraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <main className="min-h-screen bg-black px-6 py-6 text-white">
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              GPU Execution Graph
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Warp execution evidence와 probe 결과의 연결 구조를 탐색합니다.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-neutral-400">
            <span className="text-lime-300">tip</span>{" "}
            노드는 드래그해서 위치를 조정할 수 있습니다.
          </div>
        </div>
      </header>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="sticky top-6 self-start">
          <GraphCanvas onSelect={setSelectedNode} />
        </div>

        <aside className="scrollbar-hidden max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <GraphPanel selectedNode={selectedNode} />
        </aside>
      </section>
    </main>
  );
}