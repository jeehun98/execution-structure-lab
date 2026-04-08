import argparse
import os
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-dir", default="build")
    parser.add_argument("--probe", required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    exe = "probe_runner.exe" if os.name == "nt" else "probe_runner"
    exe_path = os.path.join(args.build_dir, exe)

    if not os.path.exists(exe_path):
        print(f"[error] executable not found: {exe_path}")
        sys.exit(1)

    cmd = [
        exe_path,
        "--probe", args.probe,
        "--config", args.config,
    ]

    print("[run]", " ".join(cmd))
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()