#!/bin/bash
# Setup script for installing uv and initializing the Python environment

set -e

echo "Setting up AWS precheck environment..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv not found. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo "Please restart your shell or run: source \$HOME/.cargo/env"
    echo "Then run this script again."
    exit 1
fi

echo "✓ uv is installed"

# Initialize the virtual environment
cd "$(dirname "$0")"
echo "Initializing Python environment..."
uv venv .venv
echo "✓ Virtual environment created at .venv"

echo ""
echo "Setup complete! You can now run:"
echo "  make precheck   - Run AWS account precheck"
echo "  make init       - Initialize Terraform with precheck"
echo "  make plan       - Plan Terraform changes with precheck"
