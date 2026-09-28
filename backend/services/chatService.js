"use strict";

/*
============================================================
ASSIGNMENT HELP - SITE ASSISTANT
============================================================
This service answers visitor questions using ONLY the facts
below (pulled from the live homepage) plus general, harmless
small talk. It never invents prices, order status, discounts,
or policies that aren't stated here - anything account/order
specific gets redirected to a human contact channel.

Uses Groq's free API (no credit card required) - get a key at
https://console.groq.com/keys and set it as GROQ_API_KEY.

To update what the assistant knows, edit SITE_KNOWLEDGE below
to match whatever is actually true on the homepage. Keep it in
sync manually - this does not crawl the live site at request
time, it's a static context block for speed and reliability.
============================================================
*/

const GROQ_API_KEY = String(process.env.GROQ_API_KEY || "").trim();
const MODEL = process.env.CHAT_MODEL || "openai/gpt-oss-120b";
const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_TURNS = 6; // user+assistant pairs kept for context

const SITE_KNOWLEDGE = `
BUSINESS: Assignment Help (assignmenthelp.com)
TAGLINE: Get Expert Assignment Help Online - high-quality assignment help
from subject experts, from research papers to dissertations, delivered
before the deadline.

STATS SHOWN ON SITE: 148,000+ happy students. 1,790+ subject experts.
4.96/5 average from 2,000+ student reviews. Since 2012.

WHY STUDENTS TRUST US (as stated on the site):
- 1,790+ PhD-qualified subject-expert writers across every discipline.
- 100% AI-free, original work - every assignment is researched and
  written from scratch and checked for originality.
- On-time delivery guaranteed - work is planned backwards from the
  student's due date.
- Support is described as available 24/7 in the footer; the Contact
  section separately lists working hours as Wed-Sun, 9 AM-11 PM, and
  states replies typically come within 2 hours during business hours.
  If asked about hours, mention both as stated and suggest emailing or
  calling if it's urgent.

SERVICES OFFERED:
- Essay Writing
- Research Papers
- Dissertations & Thesis (full support from proposal to final defense)
- Case Studies (business & management courses)
- Programming Assignments (code, debugging, documentation)
- Nursing & Healthcare assignments (clinical, evidence-based writing)
- Business Reports

HOW TO ORDER: Fill in the "Get 100% AI Free Assignment Help" form on the
homepage (subject, assignment deadline + time, optional file attachments)
or use the "Order Now" button in the navigation.

PRICING: Not published on the site. Pricing depends on subject, length,
academic level, and deadline. Never invent a number - tell the visitor to
submit their requirements through the form (or contact support) for a
free, no-obligation quote.

CONTACT:
- Phone: +1 (800) 123-4567
- Email: support@assignmenthelp.com
- Address: 42 Flavor Street, Sydney, NSW 2000, Australia
- Social links exist for Facebook, Instagram, TikTok/Twitter and YouTube
  in the header/footer, but no live handles are published yet.

NEWSLETTER: Subscribing gives 15% off a first order plus study tips.

WHAT THIS ASSISTANT CANNOT DO: check a specific order's status, see a
student's account or payment, quote an exact price, or make promises
(refunds, discounts, deadline exceptions) beyond what's written above.
For any of that, tell the visitor to email support@assignmenthelp.com or
call +1 (800) 123-4567.
`.trim();

const SYSTEM_PROMPT = `You are the friendly support assistant embedded on the Assignment Help website.
Answer only using the SITE FACTS below plus ordinary courteous conversation. Keep answers short - 2-4 sentences unless the visitor clearly wants a list.
Never invent prices, discounts, order status, guarantees, or policies that are not in the facts below.
If asked something outside these facts (a specific order, a refund, a price quote, anything account-specific), say you can't check that here and point them to support@assignmenthelp.com or +1 (800) 123-4567.
If asked something entirely unrelated to this business, politely say you're just the site assistant here to help with Assignment Help questions.
Do not use markdown headers or code blocks. Plain conversational text only.

SITE FACTS:
${SITE_KNOWLEDGE}`;

function sanitizeMessage(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  return text.slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  const cleaned = [];
  for (const turn of rawHistory.slice(-MAX_HISTORY_TURNS * 2)) {
    const role = turn && turn.role === "assistant" ? "assistant" : "user";
    const content = sanitizeMessage(turn && turn.content);
    if (content) cleaned.push({ role, content });
  }
  return cleaned;
}

async function askSiteAssistant(userMessage, rawHistory) {
  const message = sanitizeMessage(userMessage);
  if (!message) {
    const err = new Error("Message is required.");
    err.status = 400;
    throw err;
  }

  if (!GROQ_API_KEY) {
    const err = new Error("Chat is not configured on the server yet.");
    err.status = 503;
    throw err;
  }

  const history = sanitizeHistory(rawHistory);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[CHAT] Groq API error:", response.status, detail);
    const err = new Error("The assistant is temporarily unavailable.");
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "").trim();

  return reply || "Sorry, I couldn't put together an answer to that - could you try rephrasing?";
}

module.exports = { askSiteAssistant };
