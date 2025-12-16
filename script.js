// script.js

const WEBHOOK_URL = "https://applications-n8n.ky0uhm.easypanel.host/webhook/Econ_Livraria";

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("message-input");
const quickButtons = document.querySelectorAll(".quick-btn");

// Gera/recupera um sessionId para manter o contexto por navegador
const SESSION_KEY = "assistente_economo_session_id";
let sessionId = localStorage.getItem(SESSION_KEY);
if (!sessionId) {
  sessionId = "sessao-" + Math.random().toString(36).substring(2, 12);
  localStorage.setItem(SESSION_KEY, sessionId);
}

// Mensagem de boas-vindas
window.addEventListener("DOMContentLoaded", () => {
  addBotMessage(
    "Olá! Sou o assistente do ecônomo da Livraria Shalom. " +
      "Descreva a realidade da sua livraria ou faça suas perguntas sobre metas, campanhas, PEV ou gestão " +
      "e eu te ajudo com análise e próximos passos."
  );
});

// Envio de formulário
formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  addUserMessage(text);
  inputEl.value = "";
  await sendToBackend(text);
});

// Botões rápidos
quickButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const template = btn.getAttribute("data-template");
    if (!template) return;
    inputEl.value = template;
    inputEl.focus();
  });
});

// --- UI ---

function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";

  const msg = document.createElement("div");
  msg.className = "message user";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "Você";

  msg.appendChild(bubble);
  msg.appendChild(meta);
  row.appendChild(msg);
  chatEl.appendChild(row);
  scrollToBottom();
}

function addBotMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  const msg = document.createElement("div");
  msg.className = "message bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = formatMarkdownLite(text);

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "Assistente do Ecônomo";

  msg.appendChild(bubble);
  msg.appendChild(meta);
  row.appendChild(msg);
  chatEl.appendChild(row);
  scrollToBottom();
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = "typing-indicator-row";

  const msg = document.createElement("div");
  msg.className = "message bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML =
    "<span class='typing-dot'></span><span class='typing-dot'></span><span class='typing-dot'></span>";

  msg.appendChild(bubble);
  row.appendChild(msg);
  chatEl.appendChild(row);
  scrollToBottom();
}

function removeTypingIndicator() {
  const row = document.getElementById("typing-indicator-row");
  if (row) row.remove();
}

function scrollToBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

// --- Backend (n8n) ---

async function sendToBackend(message) {
  addTypingIndicator();

  try {
    const payload = {
      sessionId,
      message,
      source: "assistente-economo-web",
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Erro na requisição ao backend");
    }

    const data = await response.json();

    // Ajuste aqui se o n8n devolver em outro campo:
    // ex.: { "reply": "texto..." } ou { "data": { "reply": "..." } }
    const reply = data.reply || data.answer || JSON.stringify(data, null, 2);

    removeTypingIndicator();
    addBotMessage(reply);
  } catch (error) {
    console.error(error);
    removeTypingIndicator();
    addBotMessage(
      "Tive um problema para falar com o servidor agora. " +
        "Verifique o fluxo do n8n ou tente novamente em alguns instantes."
    );
  }
}

// --- Formatador simples de markdown ---

function formatMarkdownLite(text) {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **negrito**
    .replace(/^- (.*)$/gm, "<li>$1</li>");

  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  }

  html = html.replace(/\n/g, "<br />");
  return html;
}
