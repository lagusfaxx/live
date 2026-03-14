# UZEED LiveKit + TURN + Token API for Coolify

Este repo está listo para subirlo a GitHub y desplegarlo como **Docker Compose** en **Coolify**.

## Qué trae

- **LiveKit** como SFU
- **coturn** como TURN/STUN
- **Token API** mínima en Node/Express para generar JWT de LiveKit

## Antes de deployar

### 1) Crea estos subdominios apuntando a tu VPS

- `live.tudominio.cl`
- `turn.tudominio.cl`
- `live-api.tudominio.cl`

### 2) Abre estos puertos en tu VPS / proveedor / firewall

- `80/tcp`
- `443/tcp`
- `7881/tcp`
- `3478/tcp`
- `3478/udp`
- `5349/tcp`
- `5349/udp`
- `50000-50100/udp`
- `49160-49200/udp`

### 3) Duplica `.env.example` como `.env`

Reemplaza todos los placeholders.

## Archivos que debes editar sí o sí

### `livekit/livekit.yaml`

Este archivo ya viene listo, pero la llave real se inyecta por `LIVEKIT_KEYS` desde variables de entorno.

### `turn/turnserver.conf`

Debes cambiar:

- `static-auth-secret`
- `realm`
- `external-ip`

## Deploy en Coolify

### App

Crea una nueva app con build pack **Docker Compose** y usa este repo.

### Domains sugeridos

- Servicio `livekit` -> `https://live.tudominio.cl` con puerto interno `7880`
- Servicio `live-token-api` -> `https://live-api.tudominio.cl` con puerto interno `3000`
- `coturn` no necesita dominio HTTP para el proxy; necesita puertos publicados

### Variables de entorno en Coolify

Copia las de `.env.example` y reemplázalas.

## Uso rápido desde tu backend actual

Tu API de UZEED puede pedir token así:

```bash
curl -X POST https://live-api.tudominio.cl/live/token \
  -H "Authorization: Bearer TU_SHARED_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "user_123",
    "room": "live_abc",
    "name": "Agustin",
    "metadata": {"role":"host"},
    "canPublish": true,
    "canSubscribe": true,
    "canPublishData": true
  }'
```

Respuesta esperada:

```json
{
  "token": "<jwt>",
  "url": "wss://live.tudominio.cl",
  "room": "live_abc",
  "identity": "user_123"
}
```

## Cómo conectar el frontend

Con `livekit-client`:

```ts
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(url, token);
```

## ICE servers en el frontend

Si luego quieres forzar TURN o personalizar ICE servers, agrega los servers con tu dominio TURN.

Ejemplo conceptual:

```ts
const room = new Room({
  adaptiveStream: true,
  dynacast: true,
});
```

## Recomendación inicial de calidad

### Host
- 720p
- 30 fps
- simulcast encendido

### Viewers
- calidad adaptativa
- reducir a 360p cuando la red baje

## Notas importantes

- El proxy de Coolify te sirve para **HTTPS/WSS**, pero **WebRTC además necesita UDP y puertos publicados**.
- No mezcles este stack dentro de la API principal de UZEED.
- Este repo está pensado para que lo deployes **como servicio separado**.

## Checklist final

- [ ] DNS apuntando al VPS
- [ ] Firewall abierto
- [ ] `.env` completado
- [ ] `turnserver.conf` con IP pública real
- [ ] Dominios configurados en Coolify
- [ ] Token API respondiendo en `/health`
- [ ] LiveKit accesible por `wss://live.tudominio.cl`

## Siguiente paso recomendado

Después de desplegar esto, integra en UZEED:

- endpoint interno que pida token al `live-token-api`
- permisos host/viewer/cohost
- chat y gifts por tu API principal o DB separada
