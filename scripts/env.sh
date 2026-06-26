#!/usr/bin/env bash
# Source this before running the backend or its tests locally:
#   source scripts/env.sh
#
# Sets the JDK (this box ships only a JRE) and points Testcontainers at the
# rootless Podman socket (no Docker daemon here).

# --- JDK 21 (full, with javac) ---
JDK_DIR="$(ls -d /home/barbosa/jdks/jdk-21* 2>/dev/null | head -1)"
if [ -n "$JDK_DIR" ]; then
  export JAVA_HOME="$JDK_DIR"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

# --- Testcontainers via Podman (rootless) ---
export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"
export TESTCONTAINERS_RYUK_DISABLED=true

echo "JAVA_HOME=$JAVA_HOME"
echo "DOCKER_HOST=$DOCKER_HOST (Ryuk disabled)"
echo "java: $(java -version 2>&1 | head -1)"
