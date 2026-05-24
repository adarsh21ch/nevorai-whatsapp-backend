const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Nevorai WhatsApp API Running");
});

app.get("/webhook", (req, res) => {
  const verify_token = "nevorai123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("WEBHOOK VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post("/webhook", async (req, res) => {
  console.log("Webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;

      console.log("Message from:", from);

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
            to: from,
            text: {
              body: "Welcome to Nevorai 🚀",
            },
          }),
        }
      );

      const data = await response.json();

      console.log("Reply sent:", data);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});