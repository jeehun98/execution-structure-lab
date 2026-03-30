from __future__ import annotations

from computation_structure.models import OperatorProfile


PROFILE = OperatorProfile(
    name="reduction_sum",
    computation_structures=[
        "reduction",
        "summary_state",
    ],
    preservation_classes=[
        "order",
        "representation",
        "summary_state",
        "rematerialization",
    ],
    possible_primitives=[
        "sequential_accumulation",
        "warp_reduction",
        "block_reduction",
        "tree_reduction",
    ],
    pipeline=[
        "load_input",
        "partial_accumulate",
        "merge_partial_sums",
        "write_output",
    ],
    summary=(
        "Reduction over many inputs into a single accumulated value. "
        "Supports mergeable partial states and parallel tree-style execution."
    ),
)