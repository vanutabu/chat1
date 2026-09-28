(function () {
  "use strict";

  var STORAGE_KEY = "ah_chat_history_v1";
  var MAX_STORED_TURNS = 12;
  var history = [];
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) history = saved;
  } catch (e) {
    history = [];
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent = [
      "#ah-chat-launcher{position:fixed;bottom:90px;right:28px;width:58px;height:58px;border-radius:50%;",
      "background:linear-gradient(135deg,#e8281a,#c01e12);color:#fff;border:none;cursor:pointer;",
      "box-shadow:0 8px 24px rgba(232,40,26,0.4);font-size:22px;display:flex;align-items:center;",
      "justify-content:center;z-index:9995;transition:transform .25s ease;}",
      "#ah-chat-launcher:hover{transform:scale(1.07);}",
      "@media(max-width:480px){#ah-chat-launcher{bottom:82px;right:16px;width:52px;height:52px;}}",

      "#ah-chat-panel{position:fixed;bottom:158px;right:28px;width:340px;max-width:calc(100vw - 32px);",
      "height:460px;max-height:calc(100vh - 190px);background:#fff;border-radius:16px;",
      "box-shadow:0 20px 60px rgba(0,0,0,0.25);display:none;flex-direction:column;overflow:hidden;",
      "z-index:9996;font-family:'Poppins',sans-serif;}",
      "#ah-chat-panel.open{display:flex;}",
      "@media(max-width:480px){#ah-chat-panel{right:16px;bottom:142px;width:calc(100vw - 32px);}}",

      "#ah-chat-head{background:linear-gradient(135deg,#061a35,#0b3158);color:#fff;padding:14px 16px;",
      "display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}",
      "#ah-chat-head strong{font-size:14px;}",
      "#ah-chat-head span{display:block;font-size:11px;color:#a8c5dc;margin-top:2px;}",
      "#ah-chat-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;padding:4px;}",

      "#ah-chat-body{flex:1;overflow-y:auto;padding:14px;background:#f9f5f0;display:flex;flex-direction:column;gap:10px;}",
      ".ah-msg{max-width:85%;padding:9px 13px;border-radius:13px;font-size:13px;line-height:1.5;white-space:pre-wrap;}",
      ".ah-msg.user{align-self:flex-end;background:#e8281a;color:#fff;border-bottom-right-radius:3px;}",
      ".ah-msg.bot{align-self:flex-start;background:#fff;color:#333;box-shadow:0 2px 8px rgba(0,0,0,0.07);border-bottom-left-radius:3px;}",
      ".ah-msg.typing{color:#999;font-style:italic;}",

      "#ah-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #eee;flex-shrink:0;background:#fff;}",
      "#ah-chat-input{flex:1;border:1px solid #ddd;border-radius:20px;padding:9px 14px;font-size:13px;",
      "outline:none;font-family:inherit;resize:none;}",
      "#ah-chat-input:focus{border-color:#e8281a;}",
      "#ah-chat-send{background:#e8281a;color:#fff;border:none;border-radius:50%;width:38px;height:38px;",
      "flex-shrink:0;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}",
      "#ah-chat-send:disabled{opacity:.5;cursor:default;}"
    ].join("");
    document.head.appendChild(style);
  }

  function injectMarkup() {
    var launcher = document.createElement("button");
    launcher.id = "ah-chat-launcher";
    launcher.setAttribute("aria-label", "Open chat with our assistant");
    launcher.innerHTML = '<i class="fas fa-comment-dots" aria-hidden="true"></i>';

    var panel = document.createElement("div");
    panel.id = "ah-chat-panel";
    panel.innerHTML =
      '<div id="ah-chat-head">' +
      '<div><strong>Ask us anything</strong><span>Usually replies in seconds</span></div>' +
      '<button id="ah-chat-close" aria-label="Close chat">&times;</button>' +
      "</div>" +
      '<div id="ah-chat-body" role="log" aria-live="polite"></div>' +
      '<form id="ah-chat-form">' +
      '<textarea id="ah-chat-input" rows="1" maxlength="600" placeholder="Ask about services, deadlines, pricing..." aria-label="Type your question"></textarea>' +
      '<button id="ah-chat-send" type="submit" aria-label="Send"><i class="fas fa-paper-plane" aria-hidden="true"></i></button>' +
      "</form>";

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    return { launcher: launcher, panel: panel };
  }

  function addBubble(body, role, text) {
    var el = document.createElement("div");
    el.className = "ah-msg " + (role === "user" ? "user" : "bot");
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function persist() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(-MAX_STORED_TURNS * 2))
      );
    } catch (e) {
      /* sessionStorage unavailable - ignore, chat still works for this pageview */
    }
  }

  function init() {
    injectStyles();
    var refs = injectMarkup();
    var body = refs.panel.querySelector("#ah-chat-body");
    var form = refs.panel.querySelector("#ah-chat-form");
    var input = refs.panel.querySelector("#ah-chat-input");
    var sendBtn = refs.panel.querySelector("#ah-chat-send");
    var closeBtn = refs.panel.querySelector("#ah-chat-close");
    var opened = false;

    // Replay any history from this session.
    history.forEach(function (turn) {
      addBubble(body, turn.role, turn.content);
    });
    if (!history.length) {
      addBubble(
        body,
        "assistant",
        "Hi! I can answer questions about our services, how ordering works, deadlines, or how to reach our team. What would you like to know?"
      );
    }

    function togglePanel(open) {
      opened = open === undefined ? !opened : open;
      refs.panel.classList.toggle("open", opened);
      if (opened) input.focus();
    }

    refs.launcher.addEventListener("click", function () {
      togglePanel();
    });
    closeBtn.addEventListener("click", function () {
      togglePanel(false);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      addBubble(body, "user", text);
      history.push({ role: "user", content: text });
      persist();
      input.value = "";
      input.disabled = true;
      sendBtn.disabled = true;

      var typingEl = addBubble(body, "bot", "Typing...");
      typingEl.classList.add("typing");

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history.slice(-13, -1) // exclude the message just added
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          typingEl.remove();
          var reply =
            result.data && result.data.reply
              ? result.data.reply
              : result.data && result.data.message
              ? result.data.message
              : "Sorry, something went wrong - please try again or email support@assignmenthelp.com.";
          addBubble(body, "assistant", reply);
          history.push({ role: "assistant", content: reply });
          persist();
        })
        .catch(function () {
          typingEl.remove();
          addBubble(
            body,
            "assistant",
            "I'm having trouble connecting right now. Please try again shortly, or email support@assignmenthelp.com."
          );
        })
        .finally(function () {
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
        });
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
