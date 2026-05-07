import { useMemo, useState } from "react";
import buildGraph from "./buildGraph";
import GraphCanvas from "./GraphCanvas";
import GraphPanel from "./GraphPanel";

export default function GpuGraphPage() {
  const graph = useMemo(() => buildGraph(), []);
  const rootNode = graph.nodes.find((node) => node.id === "warp") ?? null;

  const [selectedNode, setSelectedNode] = useState(rootNode);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <GraphCanvas onSelect={setSelectedNode} />
      <GraphPanel selectedNode={selectedNode} />
    </div>
  );
}