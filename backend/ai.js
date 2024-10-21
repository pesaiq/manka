import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const PORT = 3000;
const app = express();
const MODEL_NAME = 'gemini-1.5-flash-latest';
const API_KEY = process.env.GOOGLE_API_KEY;
const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

const prompt = `
Extract transaction details from a message using this JSON Schema:
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0.01,
      "description": "The amount of the expense (positive number)"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "The date of the expense (YYYY-MM-DD format)"
    },
    "category": {
      "type": "string",
      "description": "The category of the expense (e.g., Groceries, Rent)"
    },
    "description": {
      "type": "string",
      "description": "Optional description of the expense"
    },
    "transaction_id": {
      "type": "string",
      "description": "Optional transaction ID of the expense"
    },
    "payment_method": {
      "type": "string",
      "enum": [
        "Cash",
        "Bank Card",
        "Mobile Money",
        "Other"
      ],
      "default": "Cash",
      "description": "Optional payment method for the expense"
    }
  }
}`;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel(
  {
    model: MODEL_NAME,
    systemInstruction: {
      parts: [{ text: prompt }],
      role: 'model',
    },
  },
  { apiVersion: 'v1beta' }
);

async function callGemini(text) {
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
    response_mime_type: 'application/json',
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [{ text }];

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  try {
    if (
      result.response.promptFeedback &&
      result.response.promptFeedback.blockReason
    ) {
      return {
        error: `Blocked for ${result.response.promptFeedback.blockReason}`,
      };
    }
    const response = result.response;
    return { response };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
app.use(express.json());

app.listen(PORT, () => {
  console.log(`AI service listening on port ${PORT}`);
});

app.get('/', function (req, res) {
  console.log({ req, res });
  res.send('Hello World');
});

app.post('/', async function (req, res) {
  console.log({ reqBody: req.body });
  const { text } = req.body.message;
  let result = await callGemini(text);

  console.log(result.response.candidates[0].content.parts[0].text);

  res.send(result.response.candidates[0].content.parts[0].text);
});

// Function to send a message to Telegram using fetch
const sendTelegramMessage = async (chat_id, text) => {
  const payload = { chat_id, text };
  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.log({ res: await response.json() });
      throw new Error(`Error sending message: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
};

// Define a route to handle webhook requests
app.post('/webhook', async (req, res) => {
  const timeoutDuration = 2500; // 2.5 seconds
  let timeoutReached = false;

  // Create a timeout promise
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      timeoutReached = true;
      resolve();
    }, timeoutDuration);
  });

  // Extract message from the request body
  const { message } = req.body;

  // Main processing promise
  const processRequest = new Promise(async resolve => {
    // Simulate a long-running process
    // await new Promise(resolve => setTimeout(resolve, 6000));
    let result = await callGemini(message.text);

    console.log('Received message:', message);

    resolve(result.response.candidates[0].content.parts[0].text);
  });

  // Race between the main processing and timeout
  await Promise.race([processRequest, timeoutPromise]);

  // If timeout was reached, send a Telegram message
  if (timeoutReached) {
    await sendTelegramMessage(message.chat.id, 'AI is still processing...');
  }

  // Proceed with the response
  const jsonResponse = await processRequest;
  res.json(jsonResponse);
});
