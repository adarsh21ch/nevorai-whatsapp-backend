const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());

const BRAND_NAME = process.env.BRAND_NAME || "Nevorai";

const NEVORAI_APP_LINK =
  process.env.NEVORAI_APP_LINK || "https://nevorai.com";

const NEVORAI_CALL_LINK =
  process.env.NEVORAI_CALL_LINK || "https://call.nevorai.com";

const NEVORAI_BASIC_PRICE =
  process.env.NEVORAI_BASIC_PRICE || "₹149/month";

const NEVORAI_PRO_PRICE =
  process.env.NEVORAI_PRO_PRICE || "₹1,499/month";

const NEVORAI_TRIAL_TEXT =
  process.env.NEVORAI_TRIAL_TEXT || "Free trial is available for new users.";

app.get("/", (req, res) => {
  res.send(`${BRAND_NAME} WhatsApp AI Running`);
});

app.get("/webhook", (req, res) => {
  const verify_token = "nevorai123";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

function normalizeText(message) {
  return message.toLowerCase().trim();
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getRuleBasedReply(userMessage) {
  const text = normalizeText(userMessage);

  if (includesAny(text, ["hi", "hello", "hii", "hey", "namaste"])) {
    return `Hi! Welcome to ${BRAND_NAME}. How can I help you today?`;
  }

  if (
    includesAny(text, [
      "what is nevorai",
      "about nevorai",
      "tell me about nevorai",
      "what is neverai",
      "about neverai",
      "tell me about neverai",
    ])
  ) {
    return `${BRAND_NAME} has two main products:

1. ${BRAND_NAME}
A video funnel and lead capture platform for creators, entrepreneurs, and business owners.

2. ${BRAND_NAME} Call
A calling, lead tracking, follow-up, and team management platform.

You can visit: ${NEVORAI_APP_LINK}`;
  }

  if (
    includesAny(text, [
      "nevorai call",
      "neverai call",
      "call app",
      "calling app",
      "call tracking",
      "follow up",
      "follow-up",
      "team tracking",
      "lead calling",
    ])
  ) {
    return `${BRAND_NAME} Call helps you upload leads, call them directly, tag leads, track follow-ups, manage team calling data, and use an AI assistant to understand your lead data.

Visit: ${NEVORAI_CALL_LINK}`;
  }

  if (
    includesAny(text, [
      "nevorai app",
      "neverai app",
      "video funnel",
      "funnel",
      "landing page",
      "forms",
      "lead capture",
      "video platform",
      "recorded live",
      "live session",
      "youtube",
      "prospect",
    ])
  ) {
    return `${BRAND_NAME} helps creators, entrepreneurs, and business owners share focused video presentations with prospects.

It supports video funnels, landing pages, forms, lead capture, multi-step funnels, and recorded-live sessions.

Visit: ${NEVORAI_APP_LINK}`;
  }

  if (
    includesAny(text, [
      "product",
      "products",
      "service",
      "services",
      "features",
      "what do you offer",
    ])
  ) {
    return `${BRAND_NAME} offers:

1. Video funnels and lead capture
2. Landing pages and forms
3. Recorded-live sessions
4. WhatsApp automation
5. Lead calling and follow-up tracking
6. Team tracking and AI lead assistant`;
  }

  if (
    includesAny(text, [
      "price",
      "pricing",
      "cost",
      "plan",
      "plans",
      "subscription",
      "charges",
      "fees",
    ])
  ) {
    return `${BRAND_NAME} pricing:

Basic: ${NEVORAI_BASIC_PRICE}
Pro: ${NEVORAI_PRO_PRICE}

${NEVORAI_TRIAL_TEXT}

Please tell me which product you are interested in: ${BRAND_NAME} or ${BRAND_NAME} Call?`;
  }

  if (
    includesAny(text, [
      "demo",
      "book demo",
      "meeting",
      "call me",
      "talk to team",
      "contact team",
    ])
  ) {
    return `Sure, we can arrange a demo. Please share your name, business type, and preferred time.`;
  }

  if (
    includesAny(text, [
      "support",
      "issue",
      "problem",
      "not working",
      "error",
      "help",
      "stuck",
    ])
  ) {
    return `Sure, please describe the issue you are facing. If possible, share a screenshot or short details, and our team will help you shortly.`;
  }

  if (
    includesAny(text, [
      "link",
      "website",
      "app link",
      "login",
      "signup",
      "sign up",
    ])
  ) {
    return `${BRAND_NAME} links:

Main platform: ${NEVORAI_APP_LINK}
${BRAND_NAME} Call: ${NEVORAI_CALL_LINK}`;
  }

  return null;
}

function buildGeminiPrompt(userMessage) {
  return `You are ${BRAND_NAME}'s WhatsApp assistant.

Your job:
Help users understand ${BRAND_NAME} in simple English and collect useful details for the team.

Language style:
- Use simple English.
- Keep replies short.
- Use 2 to 5 short lines maximum.
- Do not use technical or heavy words.
- Do not sound robotic.
- Do not introduce yourself again and again.
- Do not mention network marketing.
- Use words like creators, entrepreneurs, business owners, prospects, leads, and teams.

Truth rules:
- Do not invent features, prices, offers, discounts, guarantees, clients, or timelines.
- Do not promise anything that is not written below.
- If unsure, say the team will guide them.
- If user asks pricing, use only the pricing written below.
- If user asks for demo, ask for name, business type, and preferred time.
- If user has an issue, ask them to share details or screenshot.

Product 1: ${BRAND_NAME}
${BRAND_NAME} is a video funnel and lead capture platform for creators, entrepreneurs, and business owners.
It helps users share focused video presentations with prospects.
It can reduce distractions compared to normal public video platforms.
It supports:
- Video funnels
- Landing pages
- Forms
- Lead capture
- Multi-step funnels
- Recorded-live sessions
- Restricted/focused video viewing experience

Product 1 link:
${NEVORAI_APP_LINK}

Product 2: ${BRAND_NAME} Call
${BRAND_NAME} Call helps users upload leads, call leads directly, tag leads, track follow-ups, see calling data, manage team data, and use an AI assistant to understand lead data.
It helps save time and makes follow-up easier.

Product 2 link:
${NEVORAI_CALL_LINK}

Pricing:
Basic: ${NEVORAI_BASIC_PRICE}
Pro: ${NEVORAI_PRO_PRICE}
Trial: ${NEVORAI_TRIAL_TEXT}

Example:
User: What is ${BRAND_NAME}?
Reply: ${BRAND_NAME} has two main products. One helps with video funnels and lead capture. The other, ${BRAND_NAME} Call, helps with calling, follow-ups, lead tracking, and team data.

Now reply to this user message:
${userMessage}`;
}

async function askGemini(userMessage) {
  const models = ["gemini-2.5-flash-lite", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: buildGeminiPrompt(userMessage),
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      console.log(
        `Gemini response from ${model}:`,
        JSON.stringify(result, null, 2)
      );

      if (!result.error) {
        return (
          result?.candidates?.[0]?.content?.parts?.[0]?.text ||
          `Thanks for your message. The ${BRAND_NAME} team will get back to you shortly.`
        );
      }

      console.error(`Gemini API error from ${model}:`, result.error.message);

      if (![503, 429].includes(result.error.code)) {
        return `Thanks for your message. The ${BRAND_NAME} team has received it and will get back to you shortly.`;
      }
    } catch (error) {
      console.log(`Gemini request failed for ${model}:`, error);
    }
  }

  return `Thanks for your message. The ${BRAND_NAME} team has received it and will get back to you shortly.`;
}

async function sendWhatsAppMessage(to, messageBody) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: messageBody },
      }),
    }
  );

  const result = await response.json();
  console.log("WhatsApp send response:", JSON.stringify(result, null, 2));
  return result;
}

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const from = message.from;
      const userText = message.text.body;

      console.log("Message from:", from, "Text:", userText);

      const ruleReply = getRuleBasedReply(userText);
      const finalReply = ruleReply || (await askGemini(userText));

      await sendWhatsAppMessage(from, finalReply);

      console.log("Reply sent:", finalReply);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`${BRAND_NAME} AI Server running on port ${PORT}`);
});