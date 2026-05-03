import warp from "./nodes/warp";
import same from "./nodes/sameBaseline";
import mixed from "./nodes/mixedProbe";

const ALL_NODES = [warp, same, mixed];

export function buildGraph() {
  const edges = [];

  ALL_NODES.forEach((node) => {
    node.connectsTo?.forEach((target) => {
      edges.push({
        id: `${node.id}->${target.id}`,
        from: node.id,
        to: target.id,
        type: target.type,
      });
    });
  });

  return { nodes: ALL_NODES, edges };
}