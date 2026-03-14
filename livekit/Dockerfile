FROM livekit/livekit-server:v1.8

COPY livekit.yaml /opt/livekit-config/livekit.yaml
COPY start-livekit.sh /usr/local/bin/start-livekit.sh

ENTRYPOINT ["/usr/local/bin/start-livekit.sh"]
