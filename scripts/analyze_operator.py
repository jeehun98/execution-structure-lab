from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any, Dict, List


def load_registry_module(repo_root: Path):
    """
    Load computation-structure/registry.py directly by path.

    This avoids the normal Python import issue caused by the hyphen in
    'computation-structure'.
    """
    registry_path = repo_root / "computation-structure" / "registry.py"
    if not registry_path.exists():
        raise FileNotFoundError(f"Registry file not found: {registry_path}")

    spec = importlib.util.spec_from_file_location("esl_registry", registry_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not create import spec for: {registry_path}")

    module = importlib.util.module_from_spec(spec)

    # 중요: dataclass 등은 __module__ 기반으로 sys.modules를 참조할 수 있다.
    # exec_module 전에 등록해 둬야 한다.
    sys.modules[spec.name] = module

    spec.loader.exec_module(module)
    return module

def load_input_specs(input_path: Path) -> List[Dict[str, Any]]:
    """Load operator specs from a JSON file."""
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Input JSON must be a list of objects.")

    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Item at index {idx} must be an object.")
        if "name" not in item:
            raise ValueError(f"Item at index {idx} is missing required field 'name'.")
        if not isinstance(item["name"], str):
            raise ValueError(f"Item at index {idx} field 'name' must be a string.")

    return data


def analyze_operators(
    specs: List[Dict[str, Any]],
    registry_module,
    include_unknown: bool = False,
) -> List[Dict[str, Any]]:
    """Analyze each operator spec using the registry."""
    results: List[Dict[str, Any]] = []

    for item in specs:
        name = item["name"]

        if registry_module.has_operator(name):
            results.append(registry_module.get_operator_profile_dict(name))
            continue

        unknown_result = {
            "name": name,
            "status": "unknown_operator",
            "message": (
                f"Operator '{name}' is not registered. "
                f"Supported operators: {registry_module.list_supported_operators()}"
            ),
        }

        if include_unknown:
            results.append(unknown_result)
        else:
            raise KeyError(unknown_result["message"])

    return results


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze operator specs and attach computation structures, "
            "preservation classes, and possible primitives."
        )
    )
    parser.add_argument(
        "input_json",
        type=str,
        help="Path to the input JSON file containing operator specs.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="",
        help="Optional path to write the output JSON. Prints to stdout if omitted.",
    )
    parser.add_argument(
        "--include-unknown",
        action="store_true",
        help="Include unknown operators in the output instead of failing.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the output JSON with indentation.",
    )
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    script_path = Path(__file__).resolve()
    repo_root = script_path.parent.parent

    try:
        registry_module = load_registry_module(repo_root)
        input_path = Path(args.input_json).resolve()
        specs = load_input_specs(input_path)

        results = analyze_operators(
            specs=specs,
            registry_module=registry_module,
            include_unknown=args.include_unknown,
        )

        indent = 2 if args.pretty else None
        output_text = json.dumps(results, ensure_ascii=False, indent=indent)

        if args.output:
            output_path = Path(args.output).resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(output_text + "\n", encoding="utf-8")
        else:
            print(output_text)

        return 0

    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())