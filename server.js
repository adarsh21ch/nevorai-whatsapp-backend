const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Nevorai WhatsApp AI Running");
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
  }
});

function getRuleBasedReply(userMessage) {
  const text = userMessage.toLowerCase();

  if (
    text.includes("hi") ||
    text.includes("hello") ||
    text.includes("hii") ||
    text.includes("hey")
  ) {
    return "Hi! Welcome to Nevorai. How can I help you today?";
  }

  if (
    text.includes("about nevorai") ||
    text.includes("what is nevorai") ||
    text.includes("tell me about nevorai") ||
    text.includes("about neverai") ||
    text.includes("what is neverai") ||
    text.includes("tell me about neverai")
  ) {
    return "Nevorai is an AI-powered WhatsApp CRM and automation platform that helps businesses manage leads, automate follow-ups, track calls, host video sessions, and streamline customer communication.";
  }

  if (
    text.includes("product") ||
    text.includes("products") ||
    text.includes("service") ||
    text.includes("services") ||
    text.includes("features")
  ) {
    return "Nevorai offers WhatsApp chatbot automation, CRM, lead management, follow-up automation, call tracking, video session tools, and workflow automation for businesses.";
  }

  if (
    text.includes("price") ||
    text.includes("pricing") ||
    text.includes("cost") ||
    text.includes("plan")
  ) {
    return "Nevorai pricing depends on your business needs. Please share what you want to automate, and our team will guide you.";
  }

  if (
    text.includes("demo") ||
    text.includes("book") ||
    text.includes("meeting")
  ) {
    return "Sure, we can arrange a Nevorai demo. Please share your name and preferred time.";
  }

  if (
    text.includes("support") ||
    text.includes("issue") ||
    text.includes("problem") ||
    text.includes("help")
  ) {
    return "Sure, please describe the issue you are facing. Our team will help you shortly.";
  }

  return null;
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
                    text: `You are Nevorai's WhatsApp assistant.

Reply like a real business assistant on WhatsApp.
Keep replies short, clear, and natural.
Do not introduce yourself again and again.
Do not say "I am an AI WhatsApp assistant" unless asked.
If the user asks about products, explain Nevorai's products directly.
If unsure, ask one simple follow-up question.

Nevorai offers:
- WhatsApp chatbot automation
- CRM and lead management
- Follow-up automation
- Call tracking
- Video session tools
- Workflow automation

User message: ${userMessage}`,
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
          "Hi, welcome to Nevorai. How can I help you today?"
        );
      }

      console.error(`Gemini API error from ${model}:`, result.error.message);

      if (![503, 429].includes(result.error.code)) {
        return "Thanks for your message. The Nevorai team has received it and will get back to you shortly.";
      }
    } catch (error) {
      console.log(`Gemini request failed for ${model}:`, error);
    }
  }

  return "Thanks for your message. The Nevorai team has received it and will get back to you shortly.";
}

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const from = message.from;
      const userText = message.text.body;

      console.log("Message from:", from, "Text:", userText);

      const ruleReply = getRuleBasedReply(userText);
      const aiReply = ruleReply || (await askGemini(userText));

      await fetch(
        `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            text: { body: aiReply },
          }),
        }
      );

      console.log("Reply sent:", aiReply);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("Nevorai AI Server running on port 3000");
});