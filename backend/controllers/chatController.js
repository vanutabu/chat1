"use strict";

const { askSiteAssistant } = require("../services/chatService");

async function ask(req, res) {
  try {
    const { message, history } = req.body || {};
    const reply = await askSiteAssistant(message, history);
    res.json({ success: true, reply });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error("[CHAT ERROR]", error);
    res.status(status).json({
      success: false,
      message: error.message || "Unable to answer right now."
    });
  }
}

module.exports = { ask };
