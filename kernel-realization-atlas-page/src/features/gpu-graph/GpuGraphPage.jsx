import { useState } from "react";
import GraphCanvas from "./GraphCanvas";
import GraphPanel from "./GraphPanel";

export default function GpuGraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="min-h-screen bg-black px-8 py-12 text-white">
      <div className="mb-12">
        <h1 className="text-4xl font-semibold">GPU Execution Graph</h1>
        <p className="mt-3 text-sm text-neutral-400">
          노드를 선택하면 실행 관계가 드러납니다
        </p>
      </div>

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 flex items-center justify-center">
          <GraphCanvas onSelect={setSelectedNode} />
        </div>

        <div className="border-l border-white/10 pl-6">
          <GraphPanel selectedNode={selectedNode} />
        </div>
      </div>
    </div>
  );
}