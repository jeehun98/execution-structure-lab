from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List


@dataclass(frozen=True)
class OperatorProfile:
    """Structure-first description of an operator."""

    name: str
    computation_structures: List[str]
    preservation_classes: List[str]
    possible_primitives: List[str]
    pipeline: List[str]
    summary: str

    def to_dict(self) -> Dict[str, Any]:
        """Return a JSON-serializable dictionary."""
        return asdict(self)