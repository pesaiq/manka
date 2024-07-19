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

app.get('/', function (req, res) {
  res.send('Hello World');
});

app.listen(PORT);

// const si = `
// You are an expert in comic book history and return suggested comics based on a user's desired kind of story.

// Your response must be a JSON object containing four to five comic books. Each comic book object has the following schema:

// * name: Name of the comic book or series
// * publisher: The publisher of the comic book
// * reason: A brief reason for why the user would like this book
// `;

// const genAI = new GoogleGenerativeAI(API_KEY);
// const model = genAI.getGenerativeModel(
//   {
//     model: MODEL_NAME,
//     systemInstruction: {
//       parts: [{ text: si }],
//       role: 'model',
//     },
//   },
//   { apiVersion: 'v1beta' }
// );

// async function callGemini(text) {
//   const generationConfig = {
//     temperature: 0.9,
//     topK: 1,
//     topP: 1,
//     maxOutputTokens: 2048,
//     response_mime_type: 'application/json',
//   };

//   const safetySettings = [
//     {
//       category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//     },
//   ];

//   const parts = [{ text }];

//   const result = await model.generateContent({
//     contents: [{ role: 'user', parts }],
//     generationConfig,
//     safetySettings,
//   });

//   try {
//     if (
//       result.response.promptFeedback &&
//       result.response.promptFeedback.blockReason
//     ) {
//       return {
//         error: `Blocked for ${result.response.promptFeedback.blockReason}`,
//       };
//     }
//     const response = result.response;
//     return { response };
//   } catch (e) {
//     return {
//       error: e.message,
//     };
//   }
// }

// let result = await callGemini(
//   'I like stories that are science fiction and have strong female characters.'
// );

// console.log(result.response.candidates[0].content.parts[0].text);
