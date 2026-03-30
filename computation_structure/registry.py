from __future__ import annotations

from typing import Dict, List

from computation_structure.models import OperatorProfile
from computation_structure.operators.layernorm import PROFILE as LAYERNORM_PROFILE
from computation_structure.operators.reduction_sum import PROFILE as REDUCTION_SUM_PROFILE
from computation_structure.operators.softmax import PROFILE as SOFTMAX_PROFILE


_OPERATOR_REGISTRY: Dict[str, OperatorProfile] = {
    REDUCTION_SUM_PROFILE.name: REDUCTION_SUM_PROFILE,
    SOFTMAX_PROFILE.name: SOFTMAX_PROFILE,
    LAYERNORM_PROFILE.name: LAYERNORM_PROFILE,
}


def list_supported_operators() -> List[str]:
    """Return all supported operator names in sorted order."""
    return sorted(_OPERATOR_REGISTRY.keys())


def has_operator(name: str) -> bool:
    """Check whether an operator exists in the registry."""
    return name in _OPERATOR_REGISTRY


def get_operator_profile(name: str) -> OperatorProfile:
    """Return the operator profile or raise KeyError if unsupported."""
    if name not in _OPERATOR_REGISTRY:
        supported = ", ".join(list_supported_operators())
        raise KeyError(
            f"Unsupported operator '{name}'. Supported operators: {supported}"
        )
    return _OPERATOR_REGISTRY[name]


def get_operator_profile_dict(name: str) -> dict:
    """Return the operator profile as a JSON-serializable dictionary."""
    return get_operator_profile(name).to_dict()