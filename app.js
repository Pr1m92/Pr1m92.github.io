const questions = [
  {
    block: "Блок A · Оценка состояния",
    kicker: "Оценка состояния",
    text: "Как часто вы чувствуете усталость после рабочего дня?",
    answers: [
      { label: "Почти каждый день" },
      { label: "Чаще, чем хотелось бы признать" },
      { label: "Уже не усталость — это стиль жизни" },
      { label: "Только по официальным праздникам (и то сомневаюсь)" },
    ],
  },
  {
    block: "Блок A · Оценка состояния",
    kicker: "Оценка состояния",
    text: "Готовы ли вы к паузе без чувства вины?",
    answers: [
      { label: "Да, вину оставляю на предыдущем месте работы" },
      { label: "Почти готова — совесть ещё догоняет" },
      { label: "Готова, но привычка «ещё одну задачу» мешает" },
      { label: "Давно готова, ждала только официальную бумагу" },
    ],
  },
  {
    block: "Блок A · Оценка состояния",
    kicker: "Оценка состояния",
    text: "Что сейчас нужнее всего?",
    answers: [
      { label: "Просто тишина" },
      { label: "Сон без будильника" },
      { label: "Новая сфера — но не завтра утром" },
      { label: "Всё сразу: тишина, сон и потом уже сфера" },
    ],
  },
  {
    block: "Блок B · Нагрузка и границы",
    kicker: "Нагрузка и границы",
    text: "Как вы обычно реагируете на сообщение «это срочно» в конце дня?",
    answers: [
      { label: "Открываю… и жалею" },
      { label: "Читаю, но отвечаю уже другой жизнью" },
      { label: "Делаю вид, что телефон в режиме полёта" },
      { label: "Срочность других больше не является моей срочностью" },
    ],
  },
  {
    block: "Блок B · Нагрузка и границы",
    kicker: "Нагрузка и границы",
    text: "Сколько вкладок с «срочными» задачами можно закрыть одним махом?",
    answers: [
      { label: "Все. Сразу. Без сожаления." },
      { label: "Половину — для начала хватит" },
      { label: "Одну, но самую тяжёлую" },
      { label: "Закрываю браузер целиком — так надёжнее" },
    ],
  },
  {
    block: "Блок C · Практика покоя",
    kicker: "Практика покоя",
    text: "Готовы ли игнорировать рабочий чат как вид искусства?",
    answers: [
      { label: "Да, это современный перформанс" },
      { label: "Уже репетирую" },
      { label: "Только уведомления — сообщения пусть живут сами" },
      { label: "Чат удалён. Выставка закрыта." },
    ],
  },
  {
    block: "Блок C · Практика покоя",
    kicker: "Практика покоя",
    text: "Что первое сделаете, когда разрешение будет на руках?",
    answers: [
      { label: "Выключу всё, что пикает" },
      { label: "Сделаю чай и никуда не побегу" },
      { label: "Погуляю без цели и дедлайна" },
      { label: "Просто полежу. Это тоже план." },
    ],
  },
  {
    block: "Блок D · Финальное подтверждение",
    kicker: "Финальное подтверждение",
    text: "Вы уверены, что ещё чуть-чуть поработаете?",
    answers: [
      {
        label: "Да",
        toast: "Нет. Разрешение на отдых уже подписано.",
        forceNext: true,
      },
    ],
    single: true,
  },
];

const screens = {
  intro: document.getElementById("intro"),
  quiz: document.getElementById("quiz"),
  calculating: document.getElementById("calculating"),
  result: document.getElementById("result"),
};

const els = {
  startBtn: document.getElementById("start-btn"),
  restartBtn: document.getElementById("restart-btn"),
  stepLabel: document.getElementById("step-label"),
  blockLabel: document.getElementById("block-label"),
  progressFill: document.getElementById("progress-fill"),
  qKicker: document.getElementById("q-kicker"),
  qText: document.getElementById("q-text"),
  answers: document.getElementById("answers"),
  toast: document.getElementById("toast"),
  calcStatus: document.getElementById("calc-status"),
  calcSteps: document.getElementById("calc-steps"),
  reportId: document.getElementById("report-id"),
};

let current = 0;
let toastTimer = null;

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  document.body.classList.add("toast-open");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
    document.body.classList.remove("toast-open");
  }, 2800);
}

function updateProgress() {
  const total = questions.length;
  const pct = (current / total) * 100;
  els.progressFill.style.width = `${pct}%`;
  els.stepLabel.textContent = `Вопрос ${current + 1} из ${total}`;
  els.blockLabel.textContent = questions[current].block;
}

function renderQuestion() {
  const q = questions[current];
  updateProgress();
  els.qKicker.textContent = q.kicker;
  els.qText.textContent = q.text;
  els.answers.innerHTML = "";

  q.answers.forEach((answer) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    if (q.single) btn.classList.add("single");
    btn.textContent = answer.label;

    btn.addEventListener("click", () => {
      if (answer.toast) {
        showToast(answer.toast);
        setTimeout(() => nextStep(), 900);
        return;
      }
      nextStep();
    });

    els.answers.appendChild(btn);
  });
}

function nextStep() {
  current += 1;
  if (current >= questions.length) {
    els.progressFill.style.width = "100%";
    runCalculation();
    return;
  }
  renderQuestion();
}

function runCalculation() {
  showScreen("calculating");
  const items = [...els.calcSteps.querySelectorAll("li")];
  items.forEach((li) => li.classList.remove("active", "done"));

  const statuses = [
    "Проверяем стаж усталости",
    "Сверяем с регламентом покоя",
    "Согласование с Вселенной",
    "Подписываем разрешение",
  ];

  let i = 0;
  const tick = () => {
    if (i > 0) items[i - 1].classList.replace("active", "done");
    if (i < items.length) {
      items[i].classList.add("active");
      els.calcStatus.textContent = statuses[i] || statuses[statuses.length - 1];
      i += 1;
      setTimeout(tick, 700);
    } else {
      setTimeout(showResult, 500);
    }
  };
  tick();
}

function showResult() {
  els.reportId.textContent = String(Math.floor(1000 + Math.random() * 9000));
  showScreen("result");
}

function startQuiz() {
  current = 0;
  showScreen("quiz");
  renderQuestion();
}

els.startBtn.addEventListener("click", startQuiz);
els.restartBtn.addEventListener("click", () => {
  showScreen("intro");
});
