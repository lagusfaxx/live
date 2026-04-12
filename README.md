# Live stack para app (Coolify + LiveKit + coturn + Token API)

Repositorio listo para desplegar en **Coolify** como app de tipo **Docker Compose**.

Incluye:
- `docker-compose.yml`
- `livekit/livekit.yaml`
- `livekit/Dockerfile` (empaqueta la config de LiveKit en la imagen para evitar problemas de mounts)
- `turn/turnserver.conf`
- `token-service/` (API Node para emitir tokens LiveKit)
- `.env.example`

## Arquitectura

- **LiveKit** = SFU WebRTC.
- **coturn** = TURN/STUN para conectividad en redes restrictivas.
- **token-service** = endpoint HTTP para generar JWT de LiveKit desde tu backend.

## 1) Prerrequisitos

1. VPS con IP pública (IPv4) y Coolify funcionando.
2. DNS apuntando a ese VPS, por ejemplo:
   - `live.tudominio.com`
   - `live-api.tudominio.com`
   - `turn.tudominio.com` (opcional, útil para configuración TURN)
3. Puertos abiertos en firewall/proveedor:
   - `80/tcp`, `443/tcp`
   - `7880/tcp`, `7881/tcp`
   - `3478/tcp`, `3478/udp`
   - `5349/tcp`, `5349/udp`
   - `50000-50100/udp`
   - `49160-49200/udp`

## 2) Configurar variables

1. Copia `.env.example` a `.env`.
2. Completa TODOS los placeholders:
   - `LIVEKIT_URL` debe ser `wss://live.tudominio.com`
   - `PUBLIC_IPV4` debe ser la IP pública real
   - Genera secretos largos para `LIVEKIT_API_SECRET`, `SHARED_BEARER_TOKEN`, `TURN_STATIC_AUTH_SECRET`

## 3) Deploy en Coolify

1. Sube este repo a GitHub/GitLab.
2. En Coolify: **New Resource** → **Docker Compose**.
3. Conecta el repo y selecciona la rama.
4. En Environment Variables pega el contenido equivalente a tu `.env`.
5. Deploy.

### Domains en Coolify

- Servicio `livekit`:
  - Dominio: `live.tudominio.com`
  - Puerto interno: `7880`
  - HTTPS habilitado (esto te da `wss://`)

- Servicio `live-token-api`:
  - Dominio: `live-api.tudominio.com`
  - Puerto interno: `3000`

- Servicio `coturn`:
  - No necesita dominio HTTP para funcionar.
  - Requiere puertos publicados (ya están en `docker-compose.yml`).

## 4) Endpoint para generar token

`POST /live/token`

Headers:
- `Authorization: Bearer <SHARED_BEARER_TOKEN>`
- `Content-Type: application/json`

Body ejemplo:

```json
{
  "identity": "user_123",
  "room": "live_room_1",
  "name": "Agustin",
  "metadata": { "role": "host" },
  "canPublish": true,
  "canSubscribe": true,
  "canPublishData": true,
  "ttl": "1h"
}
```

Curl:

```bash
curl -X POST https://live-api.tudominio.com/live/token \
  -H "Authorization: Bearer TU_SHARED_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "identity":"user_123",
    "room":"live_room_1",
    "name":"Agustin",
    "metadata":{"role":"host"}
  }'
```

Respuesta:

```json
{
  "token": "<jwt>",
  "url": "wss://live.tudominio.com",
  "room": "live_room_1",
  "identity": "user_123"
}
```

## 5) Conexión desde tu app

Usa `url` + `token` retornados por `live-token-api` con `livekit-client`.

## 6) Checklist anti errores de deploy

- [ ] `LIVEKIT_URL` usa `wss://` y dominio válido.
- [ ] `PUBLIC_IPV4` coincide con la IP pública real del host.
- [ ] Puertos UDP abiertos (sin esto WebRTC falla aunque HTTPS funcione).
- [ ] `SHARED_BEARER_TOKEN` coincide entre tu backend y token-service.
- [ ] Dominio `live-api` apunta al servicio correcto (puerto interno 3000).

## Notas

- `livekit/livekit.yaml` usa `LIVEKIT_KEYS` por variable de entorno (no hardcodea secretos).
- La imagen de `livekit` se construye con `livekit/Dockerfile` y copia el YAML a `/etc/livekit.yaml` para evitar que plataformas de despliegue monten rutas como directorios por error.
- `turn/turnserver.conf` define la base de coturn; `realm`, `secret` y `external-ip` se inyectan desde variables al iniciar el contenedor.
