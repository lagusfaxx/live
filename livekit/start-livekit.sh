#!/bin/sh
set -eu

CONFIG_FILE="/opt/livekit-config/livekit.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "fatal: LiveKit config not found at $CONFIG_FILE" >&2
  exit 1
fi

exec livekit-server --config "$CONFIG_FILE"
