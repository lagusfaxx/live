#!/bin/sh
set -eu

CONFIG_FILE="/opt/livekit-config/livekit.yaml"
LEGACY_PATH="/etc/livekit/livekit.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "fatal: LiveKit config not found at $CONFIG_FILE" >&2
  exit 1
fi

# Some platforms may inject stale command args (e.g. --config /etc/livekit/livekit.yaml)
# or keep an old directory mount at that exact path. We intentionally ignore all runtime
# args and always use the bundled config file path.
if [ "$#" -gt 0 ]; then
  echo "info: ignoring injected runtime args: $*" >&2
fi

if [ -d "$LEGACY_PATH" ]; then
  echo "warn: detected legacy directory at $LEGACY_PATH; forcing config path to $CONFIG_FILE" >&2
fi

exec livekit-server --config "$CONFIG_FILE"
