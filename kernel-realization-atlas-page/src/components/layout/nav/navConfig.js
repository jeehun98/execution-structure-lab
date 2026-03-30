export const NAV_ITEMS = [
  {
    key: "atlas",
    label: "Atlas",
    href: "/atlas-new",
    panel: "atlas",
  },
  {
    key: "hardware",
    label: "Hardware",
    href: "/hardware-evidence",
    panel: "hardware",
  },
  {
    key: "semantics",
    label: "Semantics",
    href: "/properties-new",
    panel: "semantics",
  },
  {
    key: "operators",
    label: "Operators",
    href: "/operators-new",
    panel: "operators",
  },
  {
    key: "analysis",
    label: "Labs",
    href: "/analysis-new",
    panel: "analysis",
  },
  {
    key: "memory",
    label: "Memory",
    href: "/memory-new",
    panel: "memory",
  },
];

export const MENU_PANELS = {
  atlas: {
    title: "Kernel Realization Atlas",
    sections: [
      {
        title: "Start Here",
        links: [
          {
            label: "Atlas Home",
            href: "/atlas-new",
            desc: "Top-level entry point for the full atlas",
          },
          {
            label: "Atlas Overview",
            href: "/atlas-overview-new",
            desc: "How the atlas is structured and how to read it",
          },
        ],
      },
      {
        title: "Core Layers",
        links: [
          {
            label: "Hardware Evidence",
            href: "/hardware-evidence",
            desc: "Measured hardware behavior and execution primitives",
          },
          {
            label: "Optimization Semantics",
            href: "/properties-new",
            desc: "Transformation-enabling properties and meaning structure",
          },
          {
            label: "Invariants",
            href: "/invariants",
            desc: "What must remain unchanged across transformations",
          },
        ],
      },
    ],
    featured: {
      title: "Atlas Overview",
      desc: "Read the atlas from measured hardware evidence to operator realizations and realization labs.",
      href: "/atlas-overview-new",
    },
  },

  hardware: {
    title: "Hardware Evidence",
    sections: [
      {
        title: "Evidence Layers",
        links: [
          {
            label: "Hardware Evidence",
            href: "/hardware-evidence",
            desc: "Measured GPU behavior and execution evidence",
          },
          {
            label: "Hardware Characterization",
            href: "/hardware-evidence#characterization",
            desc: "Memory hierarchy, access behavior, scheduling traits",
          },
          {
            label: "Execution Primitive Lab",
            href: "/hardware-evidence#primitives",
            desc: "Reduction, streaming, rematerialization, tile staging",
          },
        ],
      },
      {
        title: "Connect Forward",
        links: [
          {
            label: "Optimization Semantics",
            href: "/properties-new",
            desc: "Move from evidence to transformation possibilities",
          },
          {
            label: "Realization Labs",
            href: "/analysis-new",
            desc: "See how measured evidence shapes realized variants",
          },
        ],
      },
    ],
    featured: {
      title: "Hardware Evidence",
      desc: "Start from measured GPU response rather than abstract assumptions.",
      href: "/hardware-evidence",
    },
  },

  semantics: {
    title: "Optimization Semantics",
    sections: [
      {
        title: "Properties",
        links: [
          {
            label: "Properties",
            href: "/properties-new",
            desc: "Transformation-enabling properties of computations",
          },
          {
            label: "Reordering",
            href: "/properties-new#reordering-properties",
            desc: "Where computation order can change",
          },
          {
            label: "Streaming",
            href: "/properties-new#streaming-properties",
            desc: "Where full materialization can be avoided",
          },
          {
            label: "Fusion / Residency",
            href: "/properties-new#fusion-properties",
            desc: "Where intermediate traffic can be reduced",
          },
        ],
      },
      {
        title: "Constraints",
        links: [
          {
            label: "Invariants",
            href: "/invariants",
            desc: "Semantic, structural, and numerical conditions",
          },
          {
            label: "Semantic Invariants",
            href: "/invariants#semantic-invariants",
            desc: "Meaning that must remain unchanged",
          },
          {
            label: "Numerical Invariants",
            href: "/invariants#numerical-invariants",
            desc: "Boundaries on numeric drift and stability",
          },
        ],
      },
    ],
    featured: {
      title: "Semantics & Constraints",
      desc: "See what transformations become possible and what boundaries they must respect.",
      href: "/properties-new",
    },
  },

  operators: {
    title: "Operator Realizations",
    sections: [
      {
        title: "Operator Families",
        links: [
          {
            label: "Operator Realizations",
            href: "/operators-new",
            desc: "Browse operators as realization spaces, not fixed kernels",
          },
          {
            label: "Dense Compute",
            href: "/operators-new#dense-compute-operators",
            desc: "GEMM-like operators with strong tiling and residency structure",
          },
          {
            label: "Reduction-Centric",
            href: "/operators-new#reduction-centric-operators",
            desc: "Operators shaped by reduction topology and accumulation behavior",
          },
          {
            label: "Attention-Like",
            href: "/operators-new#attention-like-operators",
            desc: "Streaming and weighted-reduction oriented realizations",
          },
        ],
      },
      {
        title: "Connect Forward",
        links: [
          {
            label: "Realization Labs",
            href: "/analysis-new",
            desc: "Compare how operator variants behave in practice",
          },
          {
            label: "Memory Lens",
            href: "/memory-new",
            desc: "Re-read operators through traffic, reuse, and residency",
          },
        ],
      },
    ],
    featured: {
      title: "Operator Realizations",
      desc: "Interpret each operator through properties, invariants, and possible execution paths.",
      href: "/operators-new",
    },
  },

  analysis: {
    title: "Realization Labs",
    sections: [
      {
        title: "Explore",
        links: [
          {
            label: "Realization Labs",
            href: "/analysis-new",
            desc: "Compare execution variants and their measured outcomes",
          },
          {
            label: "Variant Comparison",
            href: "/analysis-new#variant-comparison",
            desc: "Read differences across realization paths",
          },
          {
            label: "Metric Interpretation",
            href: "/analysis-new#metric-interpretation",
            desc: "Understand what measured numbers actually mean",
          },
        ],
      },
      {
        title: "Read Results",
        links: [
          {
            label: "Execution Signature",
            href: "/analysis-new#execution-signature",
            desc: "Trace and profile-level evidence of execution behavior",
          },
          {
            label: "Fusion Cases",
            href: "/analysis-new#fusion-case-studies",
            desc: "See how composite realization paths form",
          },
          {
            label: "Validation and Limits",
            href: "/analysis-new#validation-and-limits",
            desc: "Correctness, stability, and boundary conditions",
          },
        ],
      },
    ],
    featured: {
      title: "Realization Labs",
      desc: "Turn properties and operator reasoning into measured implementation comparisons.",
      href: "/analysis-new",
    },
  },

  memory: {
    title: "Memory Lens",
    sections: [
      {
        title: "Memory as Lens",
        links: [
          {
            label: "Memory Lens",
            href: "/memory-new",
            desc: "A cross-cutting memory-centric view across the atlas",
          },
          {
            label: "Streaming",
            href: "/memory-new#streaming",
            desc: "Avoid full materialization through running-state updates",
          },
          {
            label: "Rematerialization",
            href: "/memory-new#rematerialization",
            desc: "Trade recompute for reduced traffic and storage",
          },
        ],
      },
      {
        title: "Reuse & Traffic",
        links: [
          {
            label: "Residency",
            href: "/memory-new#residency",
            desc: "Keep data on-chip for local reuse",
          },
          {
            label: "Fusion",
            href: "/memory-new#fusion",
            desc: "Reduce intermediate reads and writes",
          },
          {
            label: "Traffic Elimination",
            href: "/memory-new#traffic-elimination",
            desc: "Remove unnecessary memory movement",
          },
        ],
      },
    ],
    featured: {
      title: "Memory Lens",
      desc: "Read hardware evidence, semantics, operators, and labs through memory movement and reuse.",
      href: "/memory-new",
    },
  },
};