const views = {
  landing: document.getElementById('landing-view'),
  join: document.getElementById('join-view'),
  room: document.getElementById('room-view'),
};

const elements = {
  navCreate: document.getElementById('nav-create'),
  navJoin: document.getElementById('nav-join'),
  heroCreate: document.getElementById('hero-create'),
  heroJoin: document.getElementById('hero-join'),
  landingCode: document.getElementById('landing-code'),
  joinForm: document.getElementById('join-form'),
  userName: document.getElementById('user-name'),
  roomCode: document.getElementById('room-code'),
  joinError: document.getElementById('join-error'),
  prefillCode: document.getElementById('prefill-code'),
  joinAsHost: document.getElementById('join-as-host'),
  roomCodeDisplay: document.getElementById('room-code-display'),
  copyLink: document.getElementById('copy-link'),
  participantList: document.getElementById('participant-list'),
  indicatorFeed: document.getElementById('indicator-feed'),
  openSettings: document.getElementById('open-settings'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettings: document.getElementById('close-settings'),
  hostOnlyControls: document.getElementById('host-only-controls'),
  controlMode: document.getElementById('control-mode'),
  workspace: document.getElementById('workspace'),
  backgroundOptions: document.querySelectorAll('.background-options .chip'),
  customBgUrl: document.getElementById('custom-bg-url'),
  leaveRoom: document.getElementById('leave-room'),
  mediaPlayer: document.getElementById('media-player'),
  togglePlay: document.getElementById('toggle-play'),
  seekBar: document.getElementById('seek-bar'),
  videoUrl: document.getElementById('video-url'),
  loadVideo: document.getElementById('load-video'),
  startScreenshare: document.getElementById('start-screenshare'),
  mediaTitle: document.getElementById('media-title'),
  cameraGrid: document.getElementById('camera-grid'),
  participantTemplate: document.getElementById('participant-template'),
  cameraCardTemplate: document.getElementById('camera-card-template'),
  chatFeed: document.getElementById('chat-feed'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  settingsModalEl: document.getElementById('settings-modal'),
};

const state = {
  currentView: 'landing',
  lastRoomCode: 'SYNC123',
  room: null,
  isHost: false,
  participants: [],
  chat: [],
  indicators: [],
  permissions: {
    hostOnly: false,
  },
  background: 'none',
};

function setView(target) {
  Object.values(views).forEach((view) => view.classList.remove('visible'));
  views[target].classList.add('visible');
  state.currentView = target;
}

function randomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function generateParticipants(selfName) {
  const presets = ['María', 'Lucía', 'Tomás', 'Sofía', 'Pablo', 'Nico'];
  const selection = presets.sort(() => 0.5 - Math.random()).slice(0, 3);
  const others = selection.map((name, i) => ({
    id: `${name}-${i}`,
    name,
    mic: Math.random() > 0.3,
    cam: Math.random() > 0.5,
    status: 'Conectado',
  }));
  return [
    {
      id: 'self',
      name: selfName,
      mic: true,
      cam: true,
      status: 'Host',
      host: state.isHost,
    },
    ...others,
  ];
}

function renderParticipants() {
  elements.participantList.innerHTML = '';
  state.participants.forEach((p) => {
    const clone = elements.participantTemplate.content.cloneNode(true);
    clone.querySelector('.name').textContent = p.name;
    clone.querySelector('.status').textContent = p.status;
    const badges = clone.querySelector('.badges');
    if (p.host) {
      const hostBadge = document.createElement('span');
      hostBadge.className = 'chip';
      hostBadge.textContent = 'Host';
      badges.append(hostBadge);
    }
    const mediaBadge = document.createElement('span');
    mediaBadge.className = 'chip';
    mediaBadge.textContent = `${p.cam ? '🎥' : '🚫 Cam'} · ${p.mic ? '🎙️' : '🔇'}`;
    badges.append(mediaBadge);
    elements.participantList.append(clone);
  });
}

function renderCameras() {
  elements.cameraGrid.innerHTML = '';
  state.participants.forEach((p) => {
    const card = elements.cameraCardTemplate.content.cloneNode(true);
    card.querySelector('.name').textContent = p.name;
    card.querySelector('.state').textContent = `${p.cam ? 'Cámara activa' : 'Cámara apagada'} · ${p.mic ? 'Mic on' : 'Mic off'}`;
    const video = card.querySelector('.camera-video');
    video.classList.toggle('live', p.cam);
    const micToggle = card.querySelector('.mic-toggle');
    micToggle.addEventListener('click', () => toggleParticipantMic(p.id));
    const camToggle = card.querySelector('.cam-toggle');
    camToggle.addEventListener('click', () => toggleParticipantCam(p.id));
    elements.cameraGrid.append(card);
  });
}

function addIndicator(message) {
  state.indicators.unshift({ message, at: new Date() });
  state.indicators = state.indicators.slice(0, 6);
  elements.indicatorFeed.innerHTML = '';
  state.indicators.forEach((i) => {
    const li = document.createElement('li');
    li.textContent = `${i.message} — ${i.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    elements.indicatorFeed.append(li);
  });
}

function renderChat() {
  elements.chatFeed.innerHTML = '';
  state.chat.forEach((msg) => {
    const container = document.createElement('div');
    container.className = 'chat-message';
    const meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.textContent = `${msg.user} · ${msg.time}`;
    const body = document.createElement('div');
    body.textContent = msg.text;
    container.append(meta, body);
    elements.chatFeed.append(container);
  });
  elements.chatFeed.scrollTop = elements.chatFeed.scrollHeight;
}

function syncSeekBar() {
  const { mediaPlayer, seekBar } = elements;
  const progress = (mediaPlayer.currentTime / mediaPlayer.duration) * 100 || 0;
  seekBar.value = progress;
}

function setupMediaListeners() {
  const { mediaPlayer } = elements;
  mediaPlayer.addEventListener('timeupdate', syncSeekBar);
}

function toggleParticipantMic(id) {
  state.participants = state.participants.map((p) =>
    p.id === id ? { ...p, mic: !p.mic } : p,
  );
  renderParticipants();
  renderCameras();
  addIndicator(`${participantName(id)} ${state.participants.find((p) => p.id === id).mic ? 'activó' : 'silenció'} el micrófono`);
}

function toggleParticipantCam(id) {
  state.participants = state.participants.map((p) =>
    p.id === id ? { ...p, cam: !p.cam } : p,
  );
  renderParticipants();
  renderCameras();
  addIndicator(`${participantName(id)} ${state.participants.find((p) => p.id === id).cam ? 'activó' : 'apagó'} la cámara`);
}

function participantName(id) {
  return state.participants.find((p) => p.id === id)?.name || 'Usuario';
}

function handleJoin(data) {
  state.room = {
    code: data.roomCode,
    createdAt: new Date(),
  };
  state.lastRoomCode = data.roomCode;
  state.isHost = data.isHost;
  state.participants = generateParticipants(data.name);
  state.chat = [
    {
      user: 'Sistema',
      text: `${data.name} se unió a la sala como ${data.isHost ? 'host' : 'invitado'}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];
  state.indicators = [];
  elements.roomCodeDisplay.textContent = data.roomCode;
  addIndicator('Sala creada y sincronización activa');
  renderParticipants();
  renderCameras();
  renderChat();
  updateControlMode();
  setView('room');
}

function updateControlMode() {
  elements.controlMode.textContent = state.permissions.hostOnly ? 'Solo host controla' : 'Control compartido';
}

function copyRoomLink() {
  const link = `${location.origin}/room/${state.room?.code || ''}`;
  navigator.clipboard
    .writeText(link)
    .then(() => addIndicator('Enlace copiado al portapapeles'))
    .catch(() => addIndicator('No se pudo copiar el enlace'));
}

function openSettings() {
  elements.settingsModalEl.classList.add('visible');
  elements.settingsModalEl.setAttribute('aria-hidden', 'false');
}

function closeSettings() {
  elements.settingsModalEl.classList.remove('visible');
  elements.settingsModalEl.setAttribute('aria-hidden', 'true');
}

function applyBackground(value) {
  state.background = value;
  switch (value) {
    case 'gradient':
      elements.workspace.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.12))';
      break;
    case 'dots':
      elements.workspace.style.background =
        'radial-gradient(circle at 10% 10%, rgba(255,255,255,0.04), transparent 20%), rgba(12, 19, 33, 0.9)';
      break;
    case 'custom':
      elements.workspace.style.backgroundImage = `url(${elements.customBgUrl.value || ''})`;
      elements.workspace.style.backgroundSize = 'cover';
      elements.workspace.style.backgroundPosition = 'center';
      break;
    default:
      elements.workspace.style.background = 'rgba(12, 19, 33, 0.9)';
  }
  addIndicator('Fondo de sala actualizado');
}

function ensureViewToJoin(targetCode = '') {
  elements.roomCode.value = targetCode || state.lastRoomCode;
  setView('join');
  elements.userName.focus();
}

function validateJoinForm(name, roomCode) {
  if (!name || name.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }
  if (!roomCode) {
    return 'Ingresa un código de sala válido';
  }
  return '';
}

function wireLanding() {
  elements.navCreate.addEventListener('click', () => handleJoin({
    name: 'Host',
    roomCode: randomCode(),
    isHost: true,
  }));

  elements.heroCreate.addEventListener('click', () => handleJoin({
    name: 'Host',
    roomCode: randomCode(),
    isHost: true,
  }));

  elements.navJoin.addEventListener('click', () => ensureViewToJoin());
  elements.heroJoin.addEventListener('click', () => ensureViewToJoin(elements.landingCode.value));
}

function wireJoinForm() {
  elements.prefillCode.addEventListener('click', () => {
    elements.roomCode.value = state.lastRoomCode;
  });

  elements.joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = elements.userName.value.trim();
    const roomCode = elements.roomCode.value.trim().toUpperCase();
    const error = validateJoinForm(name, roomCode);
    if (error) {
      elements.joinError.textContent = error;
      return;
    }
    elements.joinError.textContent = '';
    handleJoin({ name, roomCode, isHost: elements.joinAsHost.checked });
  });
}

function wireMediaControls() {
  elements.togglePlay.addEventListener('click', () => {
    const player = elements.mediaPlayer;
    if (player.paused) {
      player.play();
      addIndicator('El host inició la reproducción');
    } else {
      player.pause();
      addIndicator('Reproducción en pausa');
    }
  });

  elements.seekBar.addEventListener('input', (e) => {
    const player = elements.mediaPlayer;
    const percentage = Number(e.target.value) / 100;
    player.currentTime = player.duration * percentage;
    addIndicator(`Se movió al minuto ${(player.currentTime / 60).toFixed(1)}`);
  });

  elements.loadVideo.addEventListener('click', () => {
    const url = elements.videoUrl.value.trim();
    if (!url) return;
    elements.mediaPlayer.src = url;
    elements.mediaPlayer.play().catch(() => addIndicator('No se pudo reproducir el video'));
    elements.mediaTitle.textContent = 'Video personalizado';
    addIndicator('Nuevo video cargado por el host');
  });

  elements.mediaPlayer.addEventListener('ended', () => addIndicator('El video terminó'));

  elements.startScreenshare.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      addIndicator('Compartir pantalla no disponible en este navegador');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      elements.mediaPlayer.srcObject = stream;
      elements.mediaPlayer.play();
      addIndicator('Compartiendo pantalla...');
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        elements.mediaPlayer.srcObject = null;
        elements.mediaPlayer.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
        addIndicator('Se detuvo la compartición de pantalla');
      });
    } catch (err) {
      addIndicator('El usuario canceló compartir pantalla');
    }
  });
}

function wireSettings() {
  elements.openSettings.addEventListener('click', openSettings);
  elements.closeSettings.addEventListener('click', closeSettings);
  elements.hostOnlyControls.addEventListener('change', (e) => {
    state.permissions.hostOnly = e.target.checked;
    updateControlMode();
    addIndicator(state.permissions.hostOnly ? 'Solo el host controla la reproducción' : 'Control compartido activado');
  });
  elements.backgroundOptions.forEach((btn) =>
    btn.addEventListener('click', () => applyBackground(btn.dataset.bg)),
  );
  elements.customBgUrl.addEventListener('change', () => applyBackground('custom'));
  elements.settingsModalEl.addEventListener('click', (e) => {
    if (e.target === elements.settingsModalEl) closeSettings();
  });
}

function wireChat() {
  elements.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elements.chatInput.value.trim();
    if (!text) return;
    state.chat.push({
      user: state.participants.find((p) => p.id === 'self')?.name || 'Yo',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    elements.chatInput.value = '';
    renderChat();
  });
}

function wireRoomActions() {
  elements.copyLink.addEventListener('click', copyRoomLink);
  elements.leaveRoom.addEventListener('click', () => {
    addIndicator('Has salido de la sala');
    setView('landing');
  });
}

function init() {
  wireLanding();
  wireJoinForm();
  wireMediaControls();
  wireSettings();
  wireChat();
  wireRoomActions();
  setupMediaListeners();
}

init();
