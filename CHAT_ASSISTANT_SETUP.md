# Site chat assistant - setup

## What was added
- `backend/services/chatService.js` - calls the Anthropic API with your
  site's facts (services, contact info, stats, how ordering works) as
  context. Edit the `SITE_KNOWLEDGE` block in this file whenever the
  homepage content changes - it's not live-crawled, it's a static context
  block kept in sync by hand, which is faster and more reliable than
  crawling on every request.
- `backend/controllers/chatController.js`, `backend/routes/chat.js` -
  wires `POST /api/chat` into your existing Express app.
- `backend/middleware/chatRateLimit.js` - caps each visitor to 15
  messages per 5 minutes (in-memory, no new dependency) so the endpoint
  can't be used to run up your Anthropic bill.
- `js/chat-widget.js` - a floating chat bubble (bottom-right, stacked
  above your existing back-to-top button) that talks to `/api/chat`.
  It's a single self-contained file, loaded with `defer`, so it can't
  block first paint or affect the FCP/LCP work from before. It keeps the
  last few messages in `sessionStorage` so a page refresh doesn't lose
  the conversation, and never stores anything server-side.

## What you need to do
1. Get a **free** API key at https://console.groq.com/keys - just an
   email address, no credit card required.
2. In Railway, add an environment variable:
   ```
   GROQ_API_KEY=gsk_...
   ```
   Do **not** put this in `.env.example` or commit it anywhere.
3. Deploy. That's it - no frontend build step, no new npm packages.

If `GROQ_API_KEY` isn't set, the widget still loads and looks normal,
but sending a message returns a friendly "chat is not configured yet"
error instead of crashing anything.

## Free tier limits (Groq, as of this writing)
~30 requests/minute and ~14,400/day, at no cost - no credit card on
file, nothing to accidentally get billed for. If you outgrow that, Groq
also has a paid tier with higher limits on the same endpoint.

## Guardrails already built in
- The assistant only answers from the facts in `SITE_KNOWLEDGE` - it's
  told explicitly not to invent prices, order status, or policies.
- Anything account-specific (an actual order, a refund, an exact quote)
  gets redirected to support@assignmenthelp.com / +1 (800) 123-4567
  rather than guessed at.
- Messages are capped at 600 characters and conversation history sent to
  the API is capped at the last 6 turns, to bound cost/load per request.
- Rate limited per IP (15 messages / 5 min) on top of Groq's own limits,
  so it can't be spammed.

## If you'd rather use Google Gemini instead of Groq
Also free, no card required (https://aistudio.google.com/apikey), just a
different API shape. The whole integration is isolated to
`backend/services/chatService.js` - ask and I can swap it over.

## Separate, unrelated heads-up
While working on this I noticed `backend/.env.example` has a real-looking
database password, JWT secret, and Gmail SMTP password committed in plain
text to a public repo. Worth rotating those credentials and moving real
secrets to Railway's environment variables only (never in a file that
gets committed) when you get a chance.
