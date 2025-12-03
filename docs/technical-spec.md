# SyncSpace – Technical Documentation (v1)

> **Tipo de documento:** Especificación técnica + guía de desarrollo  
> **Propósito:** Definir completamente qué debe incluirse, cómo debe comportarse y cómo debe implementarse **SyncSpace**, una plataforma web de watch‑parties con videollamadas.  
> **Alcance:** MVP completo, sin incluir despliegue.

---

## 📌 Resumen del Producto

SyncSpace es una aplicación web que permite a usuarios **crear salas virtuales privadas** para:

* Ver videos de manera sincronizada
* Activar cámaras y micrófonos para verse y hablar
* Chatear y reaccionar en tiempo real
* Compartir pantalla
* Personalizar el fondo del espacio virtual

Enfocado inicialmente en **grupos pequeños (2–10 usuarios)**.

La aplicación debe funcionar sin registro obligatorio.

---

## 🎯 Objetivos del MVP

* Baja fricción → entrar en una sala en menos de 10 segundos
* Comunicación audiovisual en tiempo real
* Control compartido (con opción del host para restringirlo)
* Visual simple y moderna (UI minimalista y fluida)
* Sincronización precisa del contenido multimedia

---

## 🎨 UI / Diseño de Interfaz (Descripción Completa)

### 1️⃣ Landing Page (`/`)

**Elementos:**

* Logo SyncSpace
* Texto principal explicando el servicio
* Botones:
  * “Crear Sala” → genera código/sala nueva
  * “Unirse a Sala” → input para ingresar código
* Ilustración ligera (representación de videollamada)
* Footer con FAQ y créditos

**Interacciones:**

* Si usuario ingresa un código → `/room/:code`
* Si hace clic en crear sala → backend genera sala → redirect automático

---

### 2️⃣ Pantalla de ingreso a sala (`/room/:code` si aún no ingresó)

**Elementos:**

* Input para nombre del usuario
* Botón: “Entrar a la sala”
* Vista previa de cámara desactivada por defecto (opcional)

**Validaciones:**

* Nombre obligatorio (mín 3 caracteres)

---

### 3️⃣ Sala Virtual (`/room/:code` ya dentro)

**Layout principal dividido en 4 partes:**

📺 **Zona de video/compartición (centro)**

* Contiene iframe de YouTube/video cargado o pantalla compartida
* Botones flotantes (solo visibilidad para host si permisos restringidos):
  * Play / Pause
  * Seek bar sincronizada
  * Cargar nuevo video (input link)
  * Compartir pantalla (WebRTC ScreenTrack)

🎥 **Grid de cámaras (abajo o lateral)**

* Vista hasta de 10 usuarios
* Indicador de mic ON/OFF
* Estado de conexión (reconectando…)

📜 **Chat lateral**

* Historial scrollable
* Input abajo con enter para enviar
* Auto‑scroll con nuevos mensajes

👥 **Panel de usuarios**

* Lista de conectados
* Host marcado visualmente
* Estado: cámara/mic activados o no

🎨 **Configuración de sala (modal)**

* Fondo de sala seleccionable:
  * Color sólido
  * Imagen predeterminada
  * URL personalizada
* Roles/Permisos:
  * “Solo host puede controlar reproducción” ON/OFF

🔗 **Botón copiar enlace de sala**

**Indicadores en tiempo real:**

* “Juan está compartiendo su pantalla…”
* “María cambió el fondo de la sala”
* Tiempo del video sincronizado

---

## 🔄 Flujo de Usuario (end‑to‑end)

1. Usuario llega al landing → clic “Crear Sala”
2. Backend crea sala y redirige a `/room/XYZ123`
3. Usuario ingresa nombre y entra
4. Se conecta a:
   * **Canal RTC** (Agora) para cámara/mic
   * **Canal de estado** (signaling) para sincronización
5. Host puede activar contenido (YouTube o ScreenShare)
6. Otros reciben cambios automáticamente
7. Usuarios pueden chatear y activar mic/cam
8. Usuarios se desconectan
9. Si host se va primero → sala sigue activa
10. Si sala sin usuarios por 5 min → se marca para cleanup

---

## 👤 Roles & Permisos

| Acciones                       | Host | Invitado |
| ------------------------------ | :--: | :------: |
| Iniciar / detener reproducción |  ✔   | ⚠ (opcional) |
| Cambiar URL de video           |  ✔   |    ✖    |
| Compartir pantalla             |  ✔   |    ✔    |
| Cambiar fondo de sala          |  ✔   |    ✖    |
| Expulsar usuario (futuro)      |  ✔   |    ✖    |

---

## 📡 Arquitectura del Sistema

### Capas Principales

```
Frontend (React + Agora SDK)
  ↓ WebRTC media channels
Agora RTC Service

Frontend ↔ Backend Signaling
  (WebSockets / Realtime)

Backend API
  ↔ Base de datos (persistencia)
```

### Flujos principales

#### 1️⃣ Conexión audiovisual

* Cliente crea instancias de tracks locales (video/audio)
* Se hace **publish** al canal de Agora
* Cuando otro usuario hace publish → evento **user-published** → se suscribe

#### 2️⃣ Sincronización multimedia

* Todas las acciones de control envían **eventos de signaling**:
  * `video_play`
  * `video_pause`
  * `video_seek`
* Clientes ajustan reproductor local según payload
* Se aplican correcciones pequeñas de latencia

#### 3️⃣ Chat y presencia

* Eventos tipo:
  * `user_join`
  * `user_leave`
  * `chat_message`
* Reenviados a todos los participantes en la sala

#### 4️⃣ Personalización del entorno

* Cambios (fondo de sala) se registran y notifican por signaling
* Todos los clientes actualizan el estilo visual al recibir el nuevo estado

---

## 🧠 Lógica Interna / Estados del Cliente

**Estados principales:** `idle`, `joining`, `in_room`, `reconnecting`, `left_room`

**Eventos manejados:** cambios de permiso, nueva URL de video, desconexiones forzadas, timeout de usuario inactivo.

---

## 🗂 Interacción con Backend & Persistencia

El backend administra: creación y destrucción de salas, identificación básica de usuarios, estado persistente de la sala (URL de video, permisos, fondo), logs y cleanup.

API requerida:

* `POST /rooms` para crear sala
* `GET /rooms/:id` para estado inicial
* `POST /rooms/:id/join-leave` para registrar ingresos/salidas

Signaling solo debe persistir estado duradero.

---

## 👥 Historias de Usuario

* HU‑01 – Crear sala: max 2 clics, link compartible.
* HU‑02 – Unirme sin registrarme: entrar con nombre.
* HU‑03 – Ver video sincronizado: play del host se replica.
* HU‑04 – Hablar y verme con otros: mic/cam.
* HU‑05 – Personalizar ambiente: host cambia fondo.
* HU‑06 – Compartir pantalla: mostrar navegador.

---

## 🧪 Casos de Uso y Reglas de Negocio

* CU‑01 Unirse a sala: nombre duplicado → sufijo automático; sin cámara/mic permitido.
* CU‑02 Cambio de estado del video: host dispara; todos ejecutan < 300 ms; desync avisa.
* CU‑03 Reconexion RTC: UI indica; tracks restauran.
* CU‑04 Cambio de fondo: solo host; persistencia instantánea.
* CU‑05 Salida de usuario: reset de tracks; broadcast.

---

## 🚨 Manejo de Errores y Edge Cases

| Caso                                         | Comportamiento esperado                          |
| -------------------------------------------- | ------------------------------------------------ |
| Usuario sin permisos intenta controlar video | Mostrar toast & bloquear acción                  |
| URL de video inválida                        | Advertir → no propagar cambio                    |
| Host abandona sala                           | Un invitado se autoasigna host (opcional futuro) |
| Límite de usuarios alcanzado                 | Denegar acceso con mensaje claro                 |
| Internet intermitente                        | Modo `reconnecting` visible                      |

---

## 📍 Requerimientos Técnicos del Cliente

* Soporte browsers modernos (Chrome, Edge, Firefox)
* Permisos de cámara/mic a demanda
* WebRTC con **SFU** vía Agora
* Minimizar carga CPU (pausar preview en pestaña inactiva)

---

## 📈 Métricas futuras

* Tiempo de conexión promedio
* Porcentaje de éxito en publish RTC
* Sincronización media < 200 ms
* Retención por sala

---

## 🧩 Extensiones Futuras (no para MVP)

* Reacciones animadas
* Avatares virtuales / auto‑representación
* Salas públicas y descubrimiento social
* Integración con cuentas premium

---

## AGORA.IO – Manual rápido para Watch Party

### Requisitos previos

* Cuenta de Agora y App ID.
* Token temporal en desarrollo o servidor de generación en producción.
* Node.js 14+ y HTTPS para web; Android Studio 4.2+ para Android.

### Configuración web mínima

```html
<script src="https://cdn.agora.io/sdk/release/AgoraRTCSDK-4.18.0.js"></script>
```

```js
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = "TU_APP_ID";
const CHANNEL = "tu-canal";
const rtc = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };

async function joinCall() {
  await rtc.join(APP_ID, CHANNEL, null, 0);
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  await rtc.publish([localTracks.audioTrack, localTracks.videoTrack]);
  localTracks.videoTrack.play("local-media");
}

async function leaveCall() {
  localTracks.audioTrack?.stop();
  localTracks.videoTrack?.stop();
  await rtc.leave();
}
```

**Toggle mic/cam**

```js
async function toggleMic() {
  if (localTracks.audioTrack) {
    await localTracks.audioTrack.setEnabled(!localTracks.audioTrack.enabled);
  }
}

async function toggleCamera() {
  if (localTracks.videoTrack) {
    await localTracks.videoTrack.setEnabled(!localTracks.videoTrack.enabled);
  }
}
```

**Suscribirse a usuarios remotos**

```js
rtc.on("user-published", async (user, mediaType) => {
  await rtc.subscribe(user, mediaType);
  if (mediaType === "video") user.videoTrack.play("remote-media");
  if (mediaType === "audio") user.audioTrack.play();
});
```

### Token backend example (Node.js)

```js
const { RtcTokenBuilder } = require('agora-token');

app.get('/api/token', (req, res) => {
  const { uid, channel, role } = req.query;
  const token = RtcTokenBuilder.buildTokenWithUid(
    process.env.AGORA_APP_ID,
    process.env.AGORA_APP_CERTIFICATE,
    channel,
    parseInt(uid, 10),
    role === 'publisher' ? 1 : 2,
    Math.floor(Date.now() / 1000) + 3600
  );
  res.json({ token });
});
```

### Troubleshooting rápido

* `PERMISSION_DENIED`: pedir permisos de cámara/mic.
* `JOIN_CHANNEL_TIMEOUT`: revisar token o conectividad.
* `INVALID_APP_ID`/`TOKEN_EXPIRED`: regenerar.
* Sin video local: verificar permisos, dispositivos y `play()`.

### Buenas prácticas

* Generar tokens en backend y usar HTTPS.
* Ajustar bitrate/resolución según conexión.
* Limpiar recursos al desconectar y mostrar indicadores de estado.
* Implementar reconexión y logging (`AgoraRTC.enableLogUpload()`).

---

## Checklist de implementación

- [ ] Registrarse en Agora y obtener App ID
- [ ] Configurar SDK (web/Android) y permisos
- [ ] Implementar join/leave y publicación de tracks
- [ ] Mostrar video local y remoto
- [ ] Controles de mic/cámara y sincronización de película
- [ ] Chat y presencia en tiempo real
- [ ] Manejo de errores y logging
- [ ] Probar en múltiples dispositivos y bajo firewall
- [ ] Generar tokens desde backend

---

## Próximos pasos recomendados

1. Backend Node.js para tokens
2. Añadir autenticación básica
3. Integrar BD (Mongo/PostgreSQL) para estado
4. Sincronizar reproducción via WebSockets
5. Añadir grabación y moderación
6. Panel de administración y analytics
7. Preparar soporte multi‑idioma y mobile

