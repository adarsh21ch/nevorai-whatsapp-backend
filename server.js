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

async function askGemini(userMessage) {
  const models = [
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
  ];

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
                    text: `You are Nevorai, an AI WhatsApp assistant for business communication, CRM, leads, follow-ups, calls, video sessions, and automation. Reply clearly and helpfully.

User message: ${userMessage}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();
      console.log(`Gemini response from ${model}:`, JSON.stringify(result, null, 2));

      if (!result.error) {
        return (
          result?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Hi, welcome to Nevorai. How can I help you today?"
        );
      }

      console.error(`Gemini API error from ${model}:`, result.error.message);

      if (![503, 429].includes(result.error.code)) {
        return "Nevorai AI is facing a temporary issue. Our team will get back to you shortly.";
      }
    } catch (error) {
      console.log(`Gemini request failed for ${model}:`, error);
    }
  }

  return "Nevorai AI is temporarily busy. Please try again in a few seconds.";
}

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message && message.type === "text") {
      const from = message.from;
      const userText = message.text.body;
      console.log("Message from:", from, "Text:", userText);

      const aiReply = await askGemini(userText);

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
      console.log("AI reply sent!");
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
