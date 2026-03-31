#!/bin/sh
set -eu

# Genera la configuración en runtime para inyectar variables de entorno
cat > /etc/livekit/livekit.yaml <<EOF
port: 7880
bind_addresses:
  - "0.0.0.0"

rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: true

turn:
  enabled: true
  domain: ${TURN_DOMAIN:-}
  udp_port: 3478
  tls_port: 5349

redis: {}

keys:
  devkey: secret

logging:
  level: info
EOF

exec livekit-server --config /etc/livekit/livekit.yaml
