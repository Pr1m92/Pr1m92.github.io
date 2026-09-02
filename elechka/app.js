const COMPLIMENTS = [
  "Можно просто быть Элечкой. Это уже много.",
  "Ты чудесна такая, какая есть.",
  "Кому-то идёт автозагар, а тебе идёт всё.",
  "Стиль — это ты.",
  "Есть люди, которые заставляют сердце биться быстрее. Главное — не до инфаркта.",
  "Ты очень добрая, даже слишком добрая, и это чудесно.",
  "Ты забавная, и это недооценённая форма гениальности.",
  "Кто-то очень рад, что ты есть.",
  "Ты замечаешь мелочи, которые другие пропускают. Это редкий дар.",
  "Миндальная связь — самая крепкая связь.",
  "С тобой хочется болтать. Но и просто посидеть полюбоваться — тоже хороший план.",
  "Если бы в тебе жило несколько личностей, все бы они были классными.",
];

const FINALE_AT = 12;

const intro = document.getElementById("intro");
const diveBtn = document.getElementById("dive");
const tank = document.getElementById("tank");
const bubblesEl = document.getElementById("bubbles");
const dustEl = document.getElementById("dust");
const curious = document.getElementById("curious");
const jelly = document.getElementById("jelly");
const card = document.getElementById("card");
const cardText = document.getElementById("cardText");
const cardClose = document.getElementById("cardClose");
const letter = document.getElementById("letter");
const letterClose = document.getElementById("letterClose");
const countEl = document.getElementById("count");
const pearlRow = document.getElementById("pearlRow");
const soundBtn = document.getElementById("sound");
const cursor = document.querySelector(".glow-cursor");
const howto = document.getElementById("howto");
const howtoBubble = document.getElementById("howtoBubble");
const hint = document.getElementById("hint");

const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 720;

const state = {
  running: false,
  paused: false,
  ready: false,
  spawning: false,
  touch: coarse,
  blockDismissUntil: 0,
  bubbles: [],
  queue: shuffle([...COMPLIMENTS]),
  caught: 0,
  seen: new Set(),
  finaleShown: false,
  pointer: { x: innerWidth * 0.5, y: innerHeight * 0.45 },
  soundOn: false,
  audio: null,
};

function markTouch() {
  state.touch = true;
  document.documentElement.classList.add("is-touch");
}

function canDismiss() {
  return performance.now() >= state.blockDismissUntil;
}

function armGhostClickBlock() {
  state.blockDismissUntil = performance.now() + 700;
  const block = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  document.addEventListener("click", block, true);
  document.addEventListener("pointerup", block, true);
  window.setTimeout(() => {
    document.removeEventListener("click", block, true);
    document.removeEventListener("pointerup", block, true);
  }, 700);
}

function bindTap(element, fn) {
  element.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    fn(event);
  });
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function nextCompliment() {
  if (!state.queue.length) state.queue = shuffle([...COMPLIMENTS]);
  return state.queue.pop();
}

function spawnDust() {
  for (let i = 0; i < 28; i += 1) {
    const mote = document.createElement("span");
    mote.className = "mote";
    mote.style.left = `${Math.random() * 100}%`;
    mote.style.setProperty("--t", `${12 + Math.random() * 18}s`);
    mote.style.setProperty("--d", `${Math.random() * -20}s`);
    dustEl.append(mote);
  }
}

function pickX() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const x = 12 + Math.random() * 76;
    const clash = state.bubbles.some((bubble) => Math.abs(bubble.x - x) < 11 && bubble.y > 72);
    if (!clash) return x;
  }
  return 12 + Math.random() * 76;
}

function spawnBubble(forceGold = false) {
  if (!state.ready || state.paused || state.bubbles.length > (coarse ? 4 : 5)) return;

  const size = coarse ? 72 + Math.random() * 36 : 52 + Math.random() * 48;
  const gold = forceGold || Math.random() < 0.12;
  const button = document.createElement("button");
  button.type = "button";
  button.className = gold ? "bubble bubble--gold" : "bubble";
  button.style.width = `${size}px`;
  button.style.height = `${size}px`;
  button.setAttribute("aria-label", "Пузырь с комплиментом");

  const bubble = {
    el: button,
    x: pickX(),
    y: 112 + Math.random() * 8,
    size,
    speed: coarse ? 0.045 + Math.random() * 0.035 : 0.08 + Math.random() * 0.07,
    wobble: Math.random() * Math.PI * 2,
    text: nextCompliment(),
    gold,
  };

  bindTap(button, () => catchBubble(bubble));

  bubblesEl.append(button);
  state.bubbles.push(bubble);
  placeBubble(bubble);
}

function placeBubble(bubble) {
  const wave = Math.sin(bubble.wobble) * 2.2;
  bubble.el.style.left = `${bubble.x + wave}vw`;
  bubble.el.style.top = `${bubble.y}vh`;
}

function catchBubble(bubble) {
  if (bubble.caught || state.paused) return;
  bubble.caught = true;
  bubble.el.classList.add("is-pop");
  playPop();

  window.setTimeout(() => {
    bubble.el.remove();
    state.bubbles = state.bubbles.filter((item) => item !== bubble);
  }, 400);

  const firstTime = !state.seen.has(bubble.text);
  if (firstTime) {
    state.seen.add(bubble.text);
    state.caught += 1;
    countEl.textContent = String(state.caught);
    const pearl = document.createElement("span");
    pearl.className = "pearl";
    pearlRow.append(pearl);
  }

  showCard(bubble.text);

  if (firstTime && state.caught >= FINALE_AT && !state.finaleShown) {
    state.finaleShown = true;
    window.setTimeout(showFinale, 700);
  }
}

function showCard(text) {
  state.paused = true;
  cardText.textContent = text;
  card.hidden = false;
  armGhostClickBlock();
}

function hideCard() {
  if (!canDismiss()) return;
  card.hidden = true;
  if (letter.hidden) state.paused = false;
  beginSpawning();
}

function showFinale() {
  tank.classList.add("is-golden");
  jelly.classList.add("is-up");
  window.setTimeout(() => {
    state.paused = true;
    letter.hidden = false;
    armGhostClickBlock();
  }, 2600);
}

function hideLetter() {
  if (!canDismiss()) return;
  letter.hidden = true;
  state.paused = false;
}

function tick(now) {
  if (!state.last) state.last = now;
  const delta = Math.min(32, now - state.last);
  state.last = now;

  if (state.running) {
    state.bubbles.forEach((bubble) => {
      if (bubble.caught) return;
      bubble.y -= bubble.speed * (delta / 16);
      bubble.wobble += 0.012 * (delta / 16);

      if (!state.touch && !coarse) {
        const dx = (state.pointer.x / innerWidth) * 100 - bubble.x;
        const dy = (state.pointer.y / innerHeight) * 100 - bubble.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 14) {
          bubble.x += dx * 0.012;
          bubble.y += dy * 0.01;
        }
      }

      if (bubble.y < -8) {
        bubble.el.remove();
        state.bubbles = state.bubbles.filter((item) => item !== bubble);
      } else {
        placeBubble(bubble);
      }
    });

    const cx = (state.pointer.x / innerWidth) * 100;
    const cy = (state.pointer.y / innerHeight) * 100;
    curious.style.transform = `translate(${(cx - 50) * 0.35}vw, ${(cy - 40) * 0.25}vh)`;
  }

  requestAnimationFrame(tick);
}

function startTank() {
  intro.classList.add("is-gone");
  window.setTimeout(() => {
    intro.hidden = true;
  }, 1500);
  state.running = true;
  state.paused = true;
  spawnDust();
  unlockAudio();
  window.setTimeout(showHowto, 700);
}

function showHowto() {
  tank.classList.add("is-learning");
  howto.hidden = false;
}

function finishHowto() {
  if (state.ready) return;
  state.ready = true;
  howtoBubble.classList.add("is-pop");
  playPop();
  window.setTimeout(() => {
    howto.hidden = true;
    tank.classList.remove("is-learning");
  }, 380);

  const text = nextCompliment();
  state.seen.add(text);
  state.caught = 1;
  countEl.textContent = "1";
  const pearl = document.createElement("span");
  pearl.className = "pearl";
  pearlRow.append(pearl);
  showCard(text);
}

function beginSpawning() {
  if (state.spawning) return;
  state.spawning = true;
  spawnBubble(true);
  window.setTimeout(() => spawnBubble(), 700);
  window.setInterval(() => spawnBubble(), coarse ? 2800 : 2200);
}

function onPointer(event) {
  const point = event.touches ? event.touches[0] : event;
  state.pointer.x = point.clientX;
  state.pointer.y = point.clientY;
  if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    cursor.hidden = false;
    cursor.style.transform = `translate(${point.clientX}px, ${point.clientY}px)`;
  }
}

function createAudio() {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.035;
  noise.connect(filter).connect(noiseGain).connect(master);
  noise.start();

  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 72;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.03;
  drone.connect(droneGain).connect(master);
  drone.start();

  return { ctx, master };
}

function unlockAudio() {
  if (!state.audio) state.audio = createAudio();
  if (state.audio.ctx.state === "suspended") state.audio.ctx.resume();
}

function setSound(on) {
  state.soundOn = on;
  soundBtn.setAttribute("aria-pressed", String(on));
  soundBtn.firstElementChild.textContent = on ? "◉" : "◦";
  if (!state.audio) return;
  state.audio.master.gain.cancelScheduledValues(state.audio.ctx.currentTime);
  state.audio.master.gain.linearRampToValueAtTime(on ? 1 : 0, state.audio.ctx.currentTime + 0.4);
}

function playPop() {
  if (!state.soundOn || !state.audio) return;
  const { ctx, master } = state.audio;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380 + Math.random() * 160, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.16);
  gain.gain.setValueAtTime(0.07, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
  osc.connect(gain).connect(master);
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

diveBtn.addEventListener("click", startTank);
bindTap(howtoBubble, finishHowto);
bindTap(cardClose, hideCard);
bindTap(letterClose, hideLetter);
card.addEventListener("pointerdown", (event) => {
  if (event.target === card && !state.touch && canDismiss()) hideCard();
});
letter.addEventListener("pointerdown", (event) => {
  if (event.target === letter && !state.touch && canDismiss()) hideLetter();
});
soundBtn.addEventListener("click", () => {
  unlockAudio();
  setSound(!state.soundOn);
});
window.addEventListener("touchstart", markTouch, { passive: true });
window.addEventListener("pointermove", onPointer);
window.addEventListener("touchmove", onPointer, { passive: true });

tank.addEventListener("pointerdown", (event) => {
  if (!state.ready || state.paused || card.hidden === false) return;
  if (event.target.closest("button")) return;
  const x = event.clientX;
  const y = event.clientY;
  let nearest = null;
  let nearestGap = 28;
  state.bubbles.forEach((bubble) => {
    if (bubble.caught) return;
    const box = bubble.el.getBoundingClientRect();
    const gap = Math.hypot(x - (box.left + box.width / 2), y - (box.top + box.height / 2)) - box.width / 2;
    if (gap < nearestGap) {
      nearestGap = gap;
      nearest = bubble;
    }
  });
  if (nearest) {
    event.preventDefault();
    catchBubble(nearest);
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!letter.hidden) hideLetter();
    else if (!card.hidden) hideCard();
  }
});

requestAnimationFrame(tick);
