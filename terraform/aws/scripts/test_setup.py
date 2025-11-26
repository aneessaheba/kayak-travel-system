#!/usr/bin/env python3
"""
Quick test to verify AWS connectivity and precheck requirements
"""

import subprocess
import sys


def check_command(command, description):
    """Check if a command is available"""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✓ {description}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"✗ {description}")
        print(f"  Error: {e}")
        return False


def main():
    print("=" * 60)
    print("AWS Precheck Environment Test")
    print("=" * 60)
    print()
    
    checks = [
        (["aws", "--version"], "AWS CLI installed"),
        (["aws", "sts", "get-caller-identity"], "AWS credentials configured"),
        (["terraform", "--version"], "Terraform installed"),
        (["uv", "--version"], "uv installed"),
    ]
    
    all_passed = True
    for command, description in checks:
        if not check_command(command, description):
            all_passed = False
        print()
    
    if all_passed:
        print("=" * 60)
        print("✓ All checks passed! Ready to run make precheck")
        print("=" * 60)
        return 0
    else:
        print("=" * 60)
        print("✗ Some checks failed. Please install missing dependencies.")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
