
"use strict";

const $ = (id) => document.getElementById(id);

let authMode = "login";
let selectedMode = "uitleg";
let user = null;
let xp = 0;
let quizIndex = 0;
let quizAnswered = false;

const quiz = [
  {
    q: "Hoeveel is 7 × 8?",
    a: ["54", "56", "64", "48"],
    correct: 1,
    why: "7 × 8 = 56. Je kunt ook 7 × 4 = 28 nemen en dat verdubbelen."
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

// VEILIGE HULPFUNCTIES

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
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

  $("authTitle").innerHTML =
    mode === "login"
      ? 'Klaar om te <span>levelen?</span>'
      : 'Start jouw <span>avontuur!</span>';

  $("authSubtitle").textContent =
    mode === "login"
      ? "Log in en maak van huiswerk een avontuur."
      : "Maak een account en begin vandaag met leren.";

  $("nameField").classList.toggle("hidden", mode === "login");
  $("displayName").required = mode === "register";

  $("authSubmit").textContent =
    mode === "login" ? "🚀 Inloggen" : "✨ Account maken";

  $("switchText").textContent =
    mode === "login" ? "Nog geen account?" : "Heb je al een account?";

  $("switchAuth").textContent =
    mode === "login" ? "Maak er een!" : "Log in";

  $("password").autocomplete =
    mode === "login" ? "current-password" : "new-password";

  $("authError").textContent = "";
}

$("switchAuth").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("authSubmit");
  button.disabled = true;
  button.textContent = "Even laden...";
  $("authError").textContent = "";

  try {
    const body = {
      email: $("email").value.trim(),
      password: $("password").value,
      display_name: $("displayName").value.trim() || "Leerling"
    };

    const data = await api(
      "/api/" + (authMode === "login" ? "login" : "register"),
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    user = data.user;
    await enterApp();
  } catch (error) {
    $("authError").textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent =
      authMode === "login" ? "🚀 Inloggen" : "✨ Account maken";
  }
});

// APP STARTEN EN SESSIE CONTROLEREN

async function enterApp() {
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  try {
    const data = await api("/api/me");

    user = data.user || user;
    xp = Number(data.progress?.xp ?? 0);
  } catch (error) {
    console.warn("Profielgegevens konden niet worden geladen:", error);
  }

  const name = user?.display_name || "Leerling";

  $("helloName").textContent = name;
  $("pageTitle").textContent = "Jouw leeruniversum";

  renderXP();
  showTab("home");
  renderQuiz();
}

async function checkSession() {
  try {
    const data = await api("/api/me");

    user = data.user;
    xp = Number(data.progress?.xp ?? 0);

    await enterApp();
  } catch {
    $("authView").classList.remove("hidden");
    $("appView").classList.add("hidden");
  }
}

// NAVIGATIE — WORDT VERVOLGD IN DEEL 2


const pageTitles = {
  home: "Jouw leeruniversum 🌌",
  books: "Boekenzoeker 📚",
  tutor: "AI-huiswerkcoach 🧠",
  practice: "Oefenarena 🎯",
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

  $("pageTitle").textContent = pageTitles[tab] || "StudyNova";

  if (tab === "practice") {
    renderQuiz();
  }
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    showTab(button.dataset.tab);
  });
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => {
    showTab(button.dataset.goto);
  });
});

$("logoutBtn").addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST" });
  } catch (error) {
    console.warn("Uitloggen kon niet worden bevestigd:", error);
  }

  user = null;
  xp = 0;

  $("appView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  $("password").value = "";

  showToast("Je bent uitgelogd.");
});

// XP EN LEVELS

function renderXP() {
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;

  if ($("xpTop")) {
    $("xpTop").textContent = xp;
  }

  if ($("xpHome")) {
    $("xpHome").textContent = xp + " XP";
  }

  if ($("xpBar")) {
    $("xpBar").style.width = levelProgress + "%";
  }

  if ($("levelBubble")) {
    $("levelBubble").textContent = "LVL " + level;
  }

  if ($("sidebarLevel")) {
    $("sidebarLevel").textContent = "Level " + level + " · " +
      (level === 1 ? "Beginner" : "Leeravonturier");
  }

  if ($("worldXpBar")) {
    $("worldXpBar").style.width = levelProgress + "%";
  }

  if ($("worldLevelText")) {
    $("worldLevelText").textContent =
      "Level " + level + " · " + levelProgress + "/100 XP tot het volgende level.";
  }

  if ($("shopXp")) {
    $("shopXp").textContent = xp + " XP";
  }
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

$("bookForm").addEventListener("submit", async event => {
  event.preventDefault();

  const query = $("bookQuery").value.trim();

  if (query.length < 2) {
    $("bookMessage").textContent = "Vul minimaal twee tekens in.";
    return;
  }

  $("bookMessage").textContent = "Boeken aan het zoeken... 🔎";
  $("bookResults").replaceChildren();

  try {
    const data = await api("/api/books?q=" + encodeURIComponent(query));
    const results = Array.isArray(data.results) ? data.results : [];

    $("bookMessage").textContent =
      data.message || results.length + " resultaten gevonden";

    if (results.length === 0) {
      $("bookMessage").textContent += " Geen boeken gevonden.";
      return;
    }

    results.forEach(book => {
      const card = document.createElement("article");
      card.className = "book-card";

      if (book.cover) {
        const image = document.createElement("img");
        image.className = "book-cover";
        image.src = book.cover;
        image.alt = "Boekomslag";
        image.loading = "lazy";
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
      author.textContent =
        (book.authors || []).join(", ") || "Auteur onbekend";
      card.appendChild(author);

      const details = document.createElement("p");
      details.textContent =
        (book.year || "Jaar onbekend") +
        (book.isbn ? " · ISBN " + book.isbn : "");
      card.appendChild(details);

      const button = document.createElement("button");
      button.className = "btn primary";
      button.textContent = "Vraag uitleg over dit boek";

      button.addEventListener("click", () => {
        showTab("tutor");
        $("chatInput").value =
          'Ik gebruik het boek "' + (book.title || "dit boek") +
          '". Help me met een onderwerp of opgave uit dit boek.';
        $("chatInput").focus();
      });

      card.appendChild(button);
      $("bookResults").appendChild(card);
    });
  } catch (error) {
    $("bookMessage").textContent = error.message;
  }
});

// AI-COACH — WORDT VERVOLGD IN DEEL 3


document.querySelectorAll(".mode-btn").forEach(button => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;

    document.querySelectorAll(".mode-btn").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    $("chatInput").placeholder =
      selectedMode === "hint"
        ? "Welke opgave vind je lastig?"
        : "Stel je vraag of vertel waar je vastloopt...";
  });
});

document.querySelectorAll(".prompt-chip").forEach(button => {
  button.addEventListener("click", () => {
    $("chatInput").value = button.dataset.prompt || "";
    $("chatInput").focus();
  });
});

function addMessage(message, sender) {
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

$("chatForm").addEventListener("submit", async event => {
  event.preventDefault();

  const message = $("chatInput").value.trim();
  if (!message) return;

  $("chatInput").value = "";
  addMessage(message, "user");

  const pending = addMessage("Even nadenken... ✨", "bot");
  const button = $("chatForm").querySelector("button");

  button.disabled = true;

  try {
    const data = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        school_level: $("schoolLevel").value,
        subject: $("subject").value,
        mode: selectedMode
      })
    });

    pending.querySelector(".bubble").textContent =
      data.answer || "Ik heb geen antwoord ontvangen.";

    await awardXP(5);
  } catch (error) {
    pending.querySelector(".bubble").textContent = error.message;
  } finally {
    button.disabled = false;
    $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
  }
});

// QUIZ

function renderQuiz() {
  quizAnswered = false;

  const item = quiz[quizIndex];

  $("quizCount").textContent =
    "VRAAG " + (quizIndex + 1) + " VAN " + quiz.length;

  $("quizBar").style.width =
    (quizIndex / quiz.length * 100) + "%";

  $("quizFeedback").textContent = "";
  $("nextQuiz").classList.add("hidden");

  $("nextQuiz").textContent =
    quizIndex === quiz.length - 1
      ? "Quiz opnieuw spelen ↻"
      : "Volgende vraag →";

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
  const buttons = $("quizContent").querySelectorAll(".answer-btn");

  buttons.forEach((button, answerIndex) => {
    button.disabled = true;

    if (answerIndex === item.correct) {
      button.classList.add("correct");
    } else if (answerIndex === index) {
      button.classList.add("wrong");
    }
  });

  if (index === item.correct) {
    $("quizFeedback").textContent =
      "Helemaal goed! 🎉 " + item.why;

    awardXP(10);
  } else {
    $("quizFeedback").textContent =
      "Goed geprobeerd! 💪 " + item.why;
  }

  $("quizBar").style.width =
    ((quizIndex + 1) / quiz.length * 100) + "%";

  $("nextQuiz").classList.remove("hidden");
}

$("nextQuiz").addEventListener("click", () => {
  quizIndex = (quizIndex + 1) % quiz.length;
  renderQuiz();
});

// START

checkSession();
