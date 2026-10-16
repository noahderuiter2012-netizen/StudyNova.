"use strict";

const $ = id => document.getElementById(id);

let authMode = "login";
let selectedMode = "uitleg";
let user = null;
let xp = 0;
let quizIndex = 0;
let quizAnswered = false;

let currentSubject = "";
let currentLesson = null;
let currentExerciseIndex = 0;
let exerciseScore = 0;
let exerciseAnswered = false;

const quiz = [
  {
    q: "Hoeveel is 7 × 8?",
    a: ["54", "56", "64", "48"],
    correct: 1,
    why: "7 × 8 = 56. Je kunt 7 × 4 = 28 nemen en dat verdubbelen."
  },
  {
    q: "Welke planeet staat bekend als de rode planeet?",
    a: ["Venus", "Jupiter", "Mars", "Saturnus"],
    correct: 2,
    why: "Mars lijkt rood door ijzeroxide op het oppervlak."
  },
  {
    q: "Wat is het meervoud van 'museum'?",
    a: ["museums", "musea", "museumen", "musea's"],
    correct: 1,
    why: "'Musea' is het gebruikelijke Nederlandse meervoud."
  },
  {
    q: "Wat betekent het Engelse woord 'brave'?",
    a: ["Bang", "Dapper", "Snel", "Rustig"],
    correct: 1,
    why: "'Brave' betekent dapper of moedig."
  },
  {
    q: "Hoeveel graden heeft een rechte hoek?",
    a: ["45°", "90°", "180°", "360°"],
    correct: 1,
    why: "Een rechte hoek is 90 graden."
  }
];

// VASTE LESSEN EN OEFENINGEN

const lessons = window.studyNovaLessons || {
  "Wiskunde": [
    {
      title: "Vermenigvuldigen",
      duration: "5 minuten",
      introduction: "Vermenigvuldigen is een snelle manier om gelijke groepen bij elkaar op te tellen.",
      explanation: "Bij 4 × 3 heb je vier groepen van drie. Dat is 3 + 3 + 3 + 3 = 12. Het teken × betekent vermenigvuldigen.",
      example: "Voorbeeld: 6 × 4 = 24. Je kunt ook 6 + 6 + 6 + 6 rekenen.",
      exercises: [
        { q: "Hoeveel is 6 × 7?", a: ["36", "42", "48", "56"], correct: 1, why: "6 × 7 = 42." },
        { q: "Hoeveel is 9 × 5?", a: ["40", "45", "50", "35"], correct: 1, why: "9 × 5 = 45." },
        { q: "Je hebt 4 zakken met 8 knikkers. Hoeveel knikkers zijn dat?", a: ["12", "24", "32", "36"], correct: 2, why: "4 × 8 = 32 knikkers." }
      ]
    },
    {
      title: "Breuken begrijpen",
      duration: "6 minuten",
      introduction: "Een breuk beschrijft een deel van een geheel.",
      explanation: "Het getal boven de streep heet de teller. Het getal onder de streep heet de noemer. Bij 3/4 is het geheel in vier gelijke delen verdeeld en kies je drie delen.",
      example: "Een pizza heeft 8 gelijke stukken. Je eet er 2. Je hebt 2/8 gegeten.",
      exercises: [
        { q: "Wat is de teller van 3/5?", a: ["3", "5", "8", "15"], correct: 0, why: "De teller staat boven de breukstreep: 3." },
        { q: "Welke breuk betekent de helft?", a: ["1/3", "2/3", "1/2", "3/4"], correct: 2, why: "De helft schrijf je als 1/2." },
        { q: "Welke breuk is gelijk aan 2/4?", a: ["1/2", "1/4", "3/4", "2/3"], correct: 0, why: "2/4 vereenvoudig je door teller en noemer door 2 te delen: 1/2." }
      ]
    }
  ],
  "Nederlands": [
    {
      title: "Zelfstandige naamwoorden",
      duration: "5 minuten",
      introduction: "Zelfstandige naamwoorden zijn woorden voor mensen, dieren, dingen en plaatsen.",
      explanation: "Voorbeelden zijn leerling, hond, tafel en school. Je kunt er vaak een lidwoord voor zetten, zoals de, het of een.",
      example: "In 'De hond rent' is hond het zelfstandige naamwoord.",
      exercises: [
        { q: "Welk woord is een zelfstandig naamwoord?", a: ["Snel", "Tafel", "Rennen", "Blauw"], correct: 1, why: "Een tafel is een ding en dus een zelfstandig naamwoord." },
        { q: "Wat is het zelfstandig naamwoord in 'De kat slaapt'?", a: ["De", "Kat", "Slaapt", "Geen"], correct: 1, why: "Kat is het zelfstandig naamwoord." },
        { q: "Welke combinatie bevat een zelfstandig naamwoord?", a: ["Heel snel", "Groen gras", "Hard lopen", "Erg mooi"], correct: 1, why: "Gras is een zelfstandig naamwoord." }
      ]
    },
    {
      title: "Werkwoorden herkennen",
      duration: "5 minuten",
      introduction: "Een werkwoord vertelt vaak wat iemand doet of wat er gebeurt.",
      explanation: "In 'Ik fiets naar school' is fiets het werkwoord. Werkwoorden kunnen veranderen: ik fiets, jij fietst, wij fietsen.",
      example: "In 'De vogel zingt' is zingt het werkwoord.",
      exercises: [
        { q: "Wat is het werkwoord in 'Sam leest een boek'?", a: ["Sam", "Leest", "Boek", "Een"], correct: 1, why: "Leest vertelt wat Sam doet." },
        { q: "Welk woord is een werkwoord?", a: ["Springen", "Tafel", "Groen", "Morgen"], correct: 0, why: "Springen is een werkwoord." },
        { q: "Vul aan: Wij ... naar huis.", a: ["loopt", "lopen", "loop", "lopend"], correct: 1, why: "'Wij lopen' is de juiste vorm." }
      ]
    }
  ],
  "Engels": [
    {
      title: "Everyday English",
      duration: "5 minuten",
      introduction: "Met een paar veelgebruikte Engelse woorden kun je al eenvoudige gesprekken voeren.",
      explanation: "Hello betekent hallo. Please betekent alsjeblieft. Thank you betekent dank je wel. Goodbye betekent tot ziens.",
      example: "A: Hello! B: Hi! A: Thank you. B: You're welcome.",
      exercises: [
        { q: "Wat betekent 'thank you'?", a: ["Goedemorgen", "Dank je wel", "Tot ziens", "Alsjeblieft"], correct: 1, why: "'Thank you' betekent dank je wel." },
        { q: "Wat betekent 'goodbye'?", a: ["Hallo", "Dank je", "Tot ziens", "Alsjeblieft"], correct: 2, why: "'Goodbye' betekent tot ziens." },
        { q: "Wat betekent 'brave'?", a: ["Dapper", "Verdrietig", "Langzaam", "Klein"], correct: 0, why: "'Brave' betekent dapper." }
      ]
    }
  ],
  "Biologie": [
    {
      title: "De plant en fotosynthese",
      duration: "6 minuten",
      introduction: "Planten groeien en maken zelf voedingsstoffen.",
      explanation: "Bij fotosynthese gebruiken planten licht, water en koolstofdioxide om glucose te maken. Daarbij komt zuurstof vrij. Dit proces gebeurt vooral in de bladeren.",
      example: "Zonlicht + water + koolstofdioxide helpen de plant glucose en zuurstof te maken.",
      exercises: [
        { q: "Wat heeft een plant nodig voor fotosynthese?", a: ["Alleen zand", "Licht, water en koolstofdioxide", "Alleen zuurstof", "Alleen suiker"], correct: 1, why: "Voor fotosynthese gebruikt de plant licht, water en koolstofdioxide." },
        { q: "Welk gas komt vrij bij fotosynthese?", a: ["Zuurstof", "Helium", "Methaan", "Alleen stikstof"], correct: 0, why: "Bij fotosynthese komt zuurstof vrij." },
        { q: "In welk deel van de plant gebeurt fotosynthese vooral?", a: ["Wortels", "Bloempot", "Bladeren", "Zaden alleen"], correct: 2, why: "Fotosynthese gebeurt vooral in de bladeren." }
      ]
    }
  ],
  "Geschiedenis": [
    {
      title: "Werken met tijdlijnen",
      duration: "5 minuten",
      introduction: "Een tijdlijn helpt je gebeurtenissen in de juiste volgorde te zetten.",
      explanation: "Een tijdlijn laat zien wanneer gebeurtenissen plaatsvonden. Bij jaartallen na Christus geldt meestal: hoe groter het jaartal, hoe later de gebeurtenis.",
      example: "Romeinse tijd → middeleeuwen → moderne tijd.",
      exercises: [
        { q: "Wat laat een tijdlijn zien?", a: ["Alleen landen", "De volgorde van gebeurtenissen", "Alleen dieren", "Het weer"], correct: 1, why: "Een tijdlijn ordent gebeurtenissen in de tijd." },
        { q: "Welk jaartal komt later?", a: ["1200", "1450", "900", "700"], correct: 1, why: "1450 komt later dan de andere genoemde jaartallen." },
        { q: "Waarom gebruiken historici bronnen?", a: ["Om het verleden te onderzoeken", "Om de toekomst exact te kennen", "Om tijd te stoppen", "Alleen voor rekenen"], correct: 0, why: "Bronnen geven informatie waarmee historici het verleden onderzoeken." }
      ]
    }
  ],
  "Aardrijkskunde": [
    {
      title: "Kaarten en windrichtingen",
      duration: "5 minuten",
      introduction: "Kaarten helpen je plaatsen en gebieden te vinden.",
      explanation: "De vier hoofdwindrichtingen zijn noord, oost, zuid en west. Op veel kaarten staat noord bovenaan, maar controleer altijd de legenda en de noordpijl.",
      example: "Als je op een gewone kaart naar rechts gaat, ga je meestal naar het oosten.",
      exercises: [
        { q: "Wat is meestal de bovenkant van een kaart?", a: ["Zuid", "Oost", "Noord", "West"], correct: 2, why: "Op veel kaarten wijst de bovenkant naar het noorden." },
        { q: "Welke windrichting ligt tegenover noord?", a: ["Oost", "West", "Zuid", "Noordoost"], correct: 2, why: "Zuid ligt tegenover noord." },
        { q: "Waarvoor gebruik je een legenda?", a: ["Om kaartsymbolen te begrijpen", "Om te rekenen", "Om de temperatuur te meten", "Om woorden te vertalen"], correct: 0, why: "De legenda legt uit wat symbolen en kleuren op een kaart betekenen." }
      ]
    }
  ]
};

// VEILIGE HULPFUNCTIES

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 3200);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHTML(value);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json"
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // De server heeft mogelijk geen JSON teruggestuurd.
  }

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Er ging iets mis. Probeer het opnieuw."
    );
  }

  return data;
}

// LOGIN EN REGISTRATIE

function setAuthMode(mode) {
  authMode = mode;

  if ($("authTitle")) {
    $("authTitle").innerHTML =
      mode === "login"
        ? 'Klaar om te <span>levelen?</span>'
        : 'Start jouw <span>avontuur!</span>';
  }

  if ($("authSubtitle")) {
    $("authSubtitle").textContent =
      mode === "login"
        ? "Log in en maak van huiswerk een avontuur."
        : "Maak een account en begin vandaag met leren.";
  }

  if ($("nameField")) $("nameField").classList.toggle("hidden", mode === "login");
  if ($("displayName")) $("displayName").required = mode === "register";

  if ($("authSubmit")) {
    $("authSubmit").textContent =
      mode === "login" ? "🚀 Inloggen" : "✨ Account maken";
  }

  if ($("switchText")) {
    $("switchText").textContent =
      mode === "login" ? "Nog geen account?" : "Heb je al een account?";
  }

  if ($("switchAuth")) {
    $("switchAuth").textContent =
      mode === "login" ? "Maak er een!" : "Log in";
  }

  if ($("password")) {
    $("password").autocomplete =
      mode === "login" ? "current-password" : "new-password";
  }

  if ($("authError")) $("authError").textContent = "";
}

if ($("switchAuth")) {
  $("switchAuth").addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
  });
}

if ($("authForm")) {
  $("authForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = $("authSubmit");
    if (button) {
      button.disabled = true;
      button.textContent = "Even laden...";
    }
    if ($("authError")) $("authError").textContent = "";

    try {
      const body = {
        email: $("email").value.trim(),
        password: $("password").value,
        display_name: $("displayName")?.value.trim() || "Leerling"
      };

      const data = await api(
        "/api/" + (authMode === "login" ? "login" : "register"),
        { method: "POST", body: JSON.stringify(body) }
      );

      user = data.user;
      await enterApp();
    } catch (error) {
      if ($("authError")) $("authError").textContent = error.message;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          authMode === "login" ? "🚀 Inloggen" : "✨ Account maken";
      }
    }
  });
}

// APP STARTEN EN SESSIE CONTROLEREN

async function enterApp() {
  if ($("authView")) $("authView").classList.add("hidden");
  if ($("appView")) $("appView").classList.remove("hidden");

  try {
    const data = await api("/api/me");
    user = data.user || user;
    xp = Number(data.progress?.xp ?? 0);
  } catch (error) {
    console.warn("Profielgegevens konden niet worden geladen:", error);
  }

  const name = user?.display_name || "Leerling";

  if ($("helloName")) $("helloName").textContent = name;
  if ($("pageTitle")) $("pageTitle").textContent = "Jouw leeruniversum";

  renderXP();
  showTab("home");
  renderQuiz();
  updateLearningXP();
}

async function checkSession() {
  try {
    const data = await api("/api/me");
    user = data.user;
    xp = Number(data.progress?.xp ?? 0);
    await enterApp();
  } catch {
    if ($("authView")) $("authView").classList.remove("hidden");
    if ($("appView")) $("appView").classList.add("hidden");
  }
}

// NAVIGATIE

const pageTitles = {
  home: "Jouw leeruniversum 🌌",
  books: "Boekenzoeker 📚",
  tutor: "AI-huiswerkcoach 🧠",
  practice: "Oefenarena 🎯",
  learn: "Leeromgeving 📚",
  quests: "Quests ⚔️",
  world: "Quest World 🌌",
  badges: "Badges 🏆",
  shop: "XP Shop 🛍️",
  friends: "Friends 👥"
};

function showTab(tab) {
  const panel = $(tab + "Tab");

  if (!panel) {
    showToast("Deze pagina bestaat nog niet.");
    return;
  }

  document.querySelectorAll(".tab-panel").forEach(element => {
    element.classList.add("hidden");
  });

  panel.classList.remove("hidden");

  document.querySelectorAll(".nav-item[data-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  if ($("pageTitle")) {
    $("pageTitle").textContent = pageTitles[tab] || "StudyNova";
  }

  if (tab === "practice") renderQuiz();
  if (tab === "learn") updateLearningXP();
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => showTab(button.dataset.goto));
});

if ($("logoutBtn")) {
  $("logoutBtn").addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (error) {
      console.warn("Uitloggen kon niet worden bevestigd:", error);
    }

    user = null;
    xp = 0;

    if ($("appView")) $("appView").classList.add("hidden");
    if ($("authView")) $("authView").classList.remove("hidden");
    if ($("password")) $("password").value = "";

    showToast("Je bent uitgelogd.");
  });
}

// XP EN LEVELS

function renderXP() {
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;

  if ($("xpTop")) $("xpTop").textContent = xp;
  if ($("xpHome")) $("xpHome").textContent = xp + " XP";
  if ($("xpBar")) $("xpBar").style.width = levelProgress + "%";
  if ($("levelBubble")) $("levelBubble").textContent = "LVL " + level;

  if ($("sidebarLevel")) {
    $("sidebarLevel").textContent = "Level " + level + " · " +
      (level === 1 ? "Beginner" : "Leeravonturier");
  }

  if ($("worldXpBar")) $("worldXpBar").style.width = levelProgress + "%";

  if ($("worldLevelText")) {
    $("worldLevelText").textContent =
      "Level " + level + " · " + levelProgress + "/100 XP tot het volgende level.";
  }

  if ($("shopXp")) $("shopXp").textContent = xp + " XP";

  updateLearningXP();
}

async function awardXP(amount = 10) {
  try {
    const data = await api("/api/xp?amount=" + amount, {
      method: "POST"
    });

    xp = Number(data.xp ?? xp);
    renderXP();
    showToast("+" + amount + " XP verdiend! ✨");
  } catch (error) {
    showToast("XP kon niet worden bijgewerkt: " + error.message);
  }
    }

// BOEKENZOEKER

if ($("bookForm")) {
  $("bookForm").addEventListener("submit", async event => {
    event.preventDefault();

    const query = $("bookQuery")?.value.trim() || "";
    if (query.length < 2) {
      if ($("bookMessage")) {
        $("bookMessage").textContent = "Vul minimaal twee tekens in.";
      }
      return;
    }

    if ($("bookMessage")) $("bookMessage").textContent = "Boeken aan het zoeken... 🔎";
    if ($("bookResults")) $("bookResults").replaceChildren();

    try {
      const data = await api("/api/books?q=" + encodeURIComponent(query));
      const results = Array.isArray(data.results) ? data.results : [];

      if ($("bookMessage")) {
        $("bookMessage").textContent =
          data.message || results.length + " resultaten gevonden";
      }

      if (!results.length) {
        if ($("bookMessage")) $("bookMessage").textContent += " Geen boeken gevonden.";
        return;
      }

      results.forEach(book => {
        const card = document.createElement("article");
        card.className = "book-card";

        const image = document.createElement("img");
        image.className = "book-cover";
        image.alt = "Boekomslag";
        image.loading = "lazy";

        if (book.cover) {
          image.src = book.cover;
          image.onerror = () => {
            const placeholder = document.createElement("div");
            placeholder.className = "book-placeholder";
            placeholder.textContent = "📘";
            image.replaceWith(placeholder);
          };
          card.appendChild(image);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className = "book-placeholder";
          placeholder.textContent = "📘";
          card.appendChild(placeholder);
        }

        const title = document.createElement("h3");
        title.textContent = book.title || "Titel onbekend";
        card.appendChild(title);

        const author = document.createElement("p");
        author.textContent = (book.authors || []).join(", ") || "Auteur onbekend";
        card.appendChild(author);

        const details = document.createElement("p");
        details.textContent =
          (book.year || "Jaar onbekend") +
          (book.isbn ? " · ISBN " + book.isbn : "");
        card.appendChild(details);

        const button = document.createElement("button");
        button.className = "btn primary";
        button.type = "button";
        button.textContent = "Vraag uitleg over dit boek";

        button.addEventListener("click", () => {
          showTab("tutor");
          if ($("chatInput")) {
            $("chatInput").value =
              'Ik gebruik het boek "' + (book.title || "dit boek") +
              '". Help me met een onderwerp of opgave uit dit boek.';
            $("chatInput").focus();
          }
        });

        card.appendChild(button);
        $("bookResults")?.appendChild(card);
      });
    } catch (error) {
      if ($("bookMessage")) $("bookMessage").textContent = error.message;
    }
  });
}

// AI-COACH

document.querySelectorAll(".mode-btn").forEach(button => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;

    document.querySelectorAll(".mode-btn").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    if ($("chatInput")) {
      $("chatInput").placeholder =
        selectedMode === "hint"
          ? "Welke opgave vind je lastig?"
          : "Stel je vraag of vertel waar je vastloopt...";
    }
  });
});

document.querySelectorAll(".prompt-chip").forEach(button => {
  button.addEventListener("click", () => {
    if (!$("chatInput")) return;
    $("chatInput").value = button.dataset.prompt || "";
    $("chatInput").focus();
  });
});

function addMessage(message, sender) {
  if (!$("chatMessages")) return null;

  const row = document.createElement("div");
  row.className = "message " + sender;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = sender === "bot" ? "🦊" : "🙂";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = message;

  row.append(avatar, bubble);
  $("chatMessages").appendChild(row);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;

  return row;
}

if ($("chatForm")) {
  $("chatForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = $("chatInput")?.value.trim() || "";
    if (!message) return;

    $("chatInput").value = "";
    addMessage(message, "user");

    const pending = addMessage("Even nadenken... ✨", "bot");
    const button = $("chatForm").querySelector('button[type="submit"]')
      || $("chatForm").querySelector("button");

    if (button) button.disabled = true;

    try {
      const data = await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          school_level: $("schoolLevel")?.value || "basisschool",
          subject: $("subject")?.value || "algemeen",
          mode: selectedMode
        })
      });

      if (pending) {
        const bubble = pending.querySelector(".bubble");
        if (bubble) bubble.textContent = data.answer || "Ik heb geen antwoord ontvangen.";
      }

      await awardXP(5);
    } catch (error) {
      if (pending) {
        const bubble = pending.querySelector(".bubble");
        if (bubble) bubble.textContent = error.message;
      }
    } finally {
      if (button) button.disabled = false;
      if ($("chatMessages")) {
        $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
      }
    }
  });
}

// QUIZ

function renderQuiz() {
  if (!$("quizContent") || !quiz.length) return;

  quizAnswered = false;
  const item = quiz[quizIndex];

  if ($("quizCount")) {
    $("quizCount").textContent =
      "VRAAG " + (quizIndex + 1) + " VAN " + quiz.length;
  }

  if ($("quizBar")) {
    $("quizBar").style.width = (quizIndex / quiz.length * 100) + "%";
  }

  if ($("quizFeedback")) $("quizFeedback").textContent = "";
  if ($("nextQuiz")) {
    $("nextQuiz").classList.add("hidden");
    $("nextQuiz").textContent =
      quizIndex === quiz.length - 1
        ? "Quiz opnieuw spelen ↻"
        : "Volgende vraag →";
  }

  $("quizContent").innerHTML =
    "<h2>" + escapeHTML(item.q) + "</h2>" +
    '<div class="answers">' +
    item.a.map((answer, index) =>
      '<button class="answer-btn" data-answer="' + index + '" type="button">' +
      String.fromCharCode(65 + index) + ". " + escapeHTML(answer) +
      "</button>"
    ).join("") +
    "</div>";

  $("quizContent").querySelectorAll(".answer-btn").forEach(button => {
    button.addEventListener("click", () => {
      answerQuiz(Number(button.dataset.answer));
    });
  });
}

function answerQuiz(index) {
  if (quizAnswered) return;
  quizAnswered = true;

  const item = quiz[quizIndex];
  const buttons = $("quizContent")?.querySelectorAll(".answer-btn") || [];

  buttons.forEach((button, answerIndex) => {
    button.disabled = true;

    if (answerIndex === item.correct) {
      button.classList.add("correct");
    } else if (answerIndex === index) {
      button.classList.add("wrong");
    }
  });

  if ($("quizFeedback")) {
    if (index === item.correct) {
      $("quizFeedback").textContent = "Helemaal goed! 🎉 " + item.why;
      awardXP(10);
    } else {
      $("quizFeedback").textContent = "Goed geprobeerd! 💪 " + item.why;
    }
  }

  if ($("quizBar")) {
    $("quizBar").style.width = ((quizIndex + 1) / quiz.length * 100) + "%";
  }

  if ($("nextQuiz")) $("nextQuiz").classList.remove("hidden");
}

if ($("nextQuiz")) {
  $("nextQuiz").addEventListener("click", () => {
    quizIndex = (quizIndex + 1) % quiz.length;
    renderQuiz();
  });
}

// LEEROMGEVING — VASTE LESSEN

function updateLearningXP() {
  if ($("learnXp")) $("learnXp").textContent = xp + " XP";
}

function showLearningScreen(screen) {
  const ids = ["lessonLibrary", "lessonViewer", "lessonExercise"];

  ids.forEach(id => {
    if ($(id)) $(id).classList.add("hidden");
  });

  if (screen && $(screen)) {
    $(screen).classList.remove("hidden");
  }

  // Verberg de vakselectie wanneer je een les of oefening opent.
  const subjectGrid = $("learnTab")?.querySelector(".subject-grid");
  if (subjectGrid) {
    subjectGrid.classList.toggle(
      "hidden",
      screen === "lessonViewer" || screen === "lessonExercise" ||
      screen === "lessonLibrary"
    );
  }
}

function getSelectedSchoolLevel() {
  return $("learnLevel")?.value || "basisschool";
}

function getSelectedGrade() {
  return $("learnGrade")?.value || "1";
}

function renderLessonList(subject) {
  currentSubject = subject;

  const subjectLessons = (lessons[subject] || []).filter(
  lesson => !lesson.levels || lesson.levels.includes(getSelectedSchoolLevel())
);

  if ($("selectedSubjectTitle")) {
    $("selectedSubjectTitle").textContent = subject;
  }

  if (!$("lessonList")) return;

  $("lessonList").replaceChildren();

  if (!subjectLessons.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Er zijn nog geen lessen voor dit vak.";
    $("lessonList").appendChild(empty);
    showLearningScreen("lessonLibrary");
    return;
  }

  subjectLessons.forEach((lesson, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "lesson-list-item";

    const icon = document.createElement("span");
    icon.className = "lesson-icon";
    icon.textContent = "📖";

    const copy = document.createElement("span");
    copy.className = "lesson-copy";

    const title = document.createElement("h3");
    title.textContent = lesson.title;

    const description = document.createElement("p");
    description.textContent =
      lesson.duration + " · " + lesson.exercises.length + " oefenvragen";

    copy.append(title, description);

    const arrow = document.createElement("span");
    arrow.className = "lesson-arrow";
    arrow.textContent = "→";

    item.append(icon, copy, arrow);
    item.addEventListener("click", () => openLesson(subject, index));

    $("lessonList").appendChild(item);
  });

  showLearningScreen("lessonLibrary");
}

function openLesson(subject, index) {
  const subjectLessons = (lessons[subject] || []).filter(
  lesson => !lesson.levels || lesson.levels.includes(getSelectedSchoolLevel())
);

  if (!subjectLessons || !subjectLessons[index]) {
    showToast("Deze les kon niet worden geopend.");
    return;
  }

  currentSubject = subject;
  currentLesson = subjectLessons[index];
  currentExerciseIndex = 0;
  exerciseScore = 0;
  exerciseAnswered = false;

  if ($("lessonSubjectLabel")) {
    $("lessonSubjectLabel").textContent =
      subject + " · " + getSelectedSchoolLevel() +
      " · groep/leerjaar " + getSelectedGrade();
  }

  if ($("lessonTitle")) {
    $("lessonTitle").textContent = currentLesson.title;
  }

  if ($("lessonIntroduction")) {
    $("lessonIntroduction").textContent = currentLesson.introduction;
  }

  if ($("lessonExplanation")) {
    $("lessonExplanation").textContent = currentLesson.explanation;
  }

  if ($("lessonExample")) {
    $("lessonExample").textContent = currentLesson.example;
  }

  showLearningScreen("lessonViewer");
}

function startLessonPractice() {
  if (!currentLesson) {
    showToast("Kies eerst een les.");
    return;
  }

  currentExerciseIndex = 0;
  exerciseScore = 0;
  exerciseAnswered = false;

  renderLessonExercise();
  showLearningScreen("lessonExercise");
}

function renderLessonExercise() {
  if (!currentLesson || !$("exerciseQuestion")) return;

  const exercises = currentLesson.exercises;

  if (currentExerciseIndex >= exercises.length) {
    finishLessonExercise();
    return;
  }

  exerciseAnswered = false;

  const exercise = exercises[currentExerciseIndex];

  if ($("exerciseCounter")) {
    $("exerciseCounter").textContent =
      "Vraag " + (currentExerciseIndex + 1) + " van " + exercises.length;
  }

  if ($("exerciseScore")) {
    $("exerciseScore").textContent = "Score: " + exerciseScore;
  }

  $("exerciseQuestion").textContent = exercise.q;

  if ($("exerciseAnswers")) {
    $("exerciseAnswers").replaceChildren();

    exercise.a.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "exercise-answer";
      button.textContent =
        String.fromCharCode(65 + index) + ". " + answer;

      button.addEventListener("click", () => {
        answerLessonExercise(index);
      });

      $("exerciseAnswers").appendChild(button);
    });
  }

  if ($("exerciseFeedback")) {
    $("exerciseFeedback").textContent = "";
    $("exerciseFeedback").classList.remove("correct", "incorrect");
  }

  if ($("nextExercise")) {
    $("nextExercise").classList.add("hidden");
    $("nextExercise").textContent =
      currentExerciseIndex === exercises.length - 1
        ? "Resultaat bekijken →"
        : "Volgende vraag →";
  }

  if ($("exerciseComplete")) {
    $("exerciseComplete").classList.add("hidden");
  }
}

function answerLessonExercise(index) {
  if (!currentLesson || exerciseAnswered) return;

  exerciseAnswered = true;

  const exercise = currentLesson.exercises[currentExerciseIndex];
  const buttons =
    $("exerciseAnswers")?.querySelectorAll("button") || [];

  buttons.forEach((button, answerIndex) => {
    button.disabled = true;

    if (answerIndex === exercise.correct) {
      button.classList.add("correct");
    } else if (answerIndex === index) {
      button.classList.add("incorrect");
    }
  });

  const isCorrect = index === exercise.correct;

  if (isCorrect) {
    exerciseScore++;

    if ($("exerciseFeedback")) {
      $("exerciseFeedback").textContent =
        "Goed gedaan! 🎉 " + exercise.why;
      $("exerciseFeedback").classList.add("correct");
      $("exerciseFeedback").classList.remove("incorrect");
    }

    awardXP(5);
  } else {
    if ($("exerciseFeedback")) {
      $("exerciseFeedback").textContent =
        "Nog niet helemaal. 💪 " + exercise.why;
      $("exerciseFeedback").classList.add("incorrect");
      $("exerciseFeedback").classList.remove("correct");
    }
  }

  if ($("exerciseScore")) {
    $("exerciseScore").textContent = "Score: " + exerciseScore;
  }

  if ($("nextExercise")) {
    $("nextExercise").classList.remove("hidden");
  }
}

function finishLessonExercise() {
  if ($("exerciseComplete")) {
    $("exerciseComplete").classList.remove("hidden");
  }

  if ($("exerciseSummary")) {
    $("exerciseSummary").textContent =
      "Je hebt " + exerciseScore + " van " +
      currentLesson.exercises.length + " vragen goed beantwoord.";
  }

  if ($("exerciseQuestion")) $("exerciseQuestion").textContent = "Les afgerond! 🎉";
  if ($("exerciseAnswers")) $("exerciseAnswers").replaceChildren();
  if ($("exerciseFeedback")) $("exerciseFeedback").textContent = "";
  if ($("exerciseCounter")) $("exerciseCounter").textContent = "Resultaat";
  if ($("nextExercise")) $("nextExercise").classList.add("hidden");
}

function askAIAboutLesson() {
  if (!currentLesson) {
    showToast("Open eerst een les om hierover vragen te stellen.");
    return;
  }

  showTab("tutor");

  if ($("subject")) {
    const subjectOption = Array.from($("subject").options || []).find(option =>
      option.textContent.toLowerCase().includes(currentSubject.toLowerCase())
    );

    if (subjectOption) $("subject").value = subjectOption.value;
  }

  if ($("chatInput")) {
    $("chatInput").value =
      "Ik ben bezig met de les '" + currentLesson.title +
      "' voor " + currentSubject + ".\n\n" +
      "Leg dit onderwerp eenvoudig uit op mijn niveau (" +
      getSelectedSchoolLevel() + ", groep/leerjaar " +
      getSelectedGrade() + "). Geef een voorbeeld en stel daarna een controlevraag.";

    $("chatInput").focus();
  }
}

// VAKKEN KIEZEN

function getSubjectFromCard(card) {
  if (card.dataset.subject && lessons[card.dataset.subject]) {
    return card.dataset.subject;
  }

  const heading = card.querySelector("h2, h3, h4");
  const text = heading?.textContent.trim() || card.textContent.trim();

  return Object.keys(lessons).find(subject =>
    text.toLowerCase().includes(subject.toLowerCase())
  );
}

document.querySelectorAll("#learnTab .subject-card").forEach(card => {
  const subject = getSubjectFromCard(card);

  if (!subject) return;

  card.addEventListener("click", () => {
    renderLessonList(subject);
  });

  if (card.tagName !== "BUTTON") {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        renderLessonList(subject);
      }
    });
  }
});

// TERUGNAVIGATIE EN OEFENINGEN

if ($("backToSubjects")) {
  $("backToSubjects").addEventListener("click", () => {
    showLearningScreen(null);

    const subjectGrid = $("learnTab")?.querySelector(".subject-grid");
    if (subjectGrid) subjectGrid.classList.remove("hidden");

    if ($("lessonLibrary")) $("lessonLibrary").classList.add("hidden");
  });
}

if ($("backToLesson")) {
  $("backToLesson").addEventListener("click", () => {
    showLearningScreen("lessonViewer");
  });
}

if ($("startLessonPractice")) {
  $("startLessonPractice").addEventListener("click", startLessonPractice);
}

if ($("nextExercise")) {
  $("nextExercise").addEventListener("click", () => {
    if (!currentLesson || !exerciseAnswered) return;

    currentExerciseIndex++;
    renderLessonExercise();
  });
}

if ($("retryExercise")) {
  $("retryExercise").addEventListener("click", () => {
    startLessonPractice();
  });
}

if ($("askLessonAI")) {
  $("askLessonAI").addEventListener("click", askAIAboutLesson);
}

if ($("openLearningAI")) {
  $("openLearningAI").addEventListener("click", () => {
    if (currentLesson) {
      askAIAboutLesson();
    } else {
      showTab("tutor");

      if ($("chatInput")) {
        $("chatInput").value =
          "Help me een schoolonderwerp te leren. Vraag eerst welk vak en niveau ik doe.";
        $("chatInput").focus();
      }
    }
  });
}

// NIVEAU EN LEERJAAR

if ($("learnLevel")) {
  $("learnLevel").addEventListener("change", () => {
    showToast("Niveau ingesteld op " + $("learnLevel").selectedOptions[0].textContent + ".");
  });
}

if ($("learnGrade")) {
  $("learnGrade").addEventListener("change", () => {
    showToast("Groep/leerjaar aangepast.");
  });
}

// START

checkSession();
