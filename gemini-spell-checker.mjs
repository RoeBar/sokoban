// This module uses Google's Gemini generative AI to detect fantasy spell names from user input.
// It initializes the model with specific instructions and exposes one function: detectSpell.
// Input: a string (natural language sentence from the user)
// Output: a stringified JSON response with the recognized spell or null

import dotenv from "dotenv"
import { GoogleGenerativeAI } from "@google/generative-ai";

// this is used to get the GEMINI_API_KEY 
dotenv.config();  

// Create a new instance of the Gemini API client using the provided API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get a lightweight Gemini model for fast responses
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// Start a chat session with predefined instructions for spell recognition
const chat = await model.startChat({
  history: [],
  systemInstruction: {
    role: "system",
    parts: [{
      text: `You are a spell recognition system for a fantasy game.

Your job is to analyze a natural language sentence from the player and determine if it explicitly mentions the name of a known spell.

The recognized spells are:
- "fireball"
- "rage"

Return a JSON object with a single key: "spell".

If the input includes the exact word of one of the known spells (case-insensitive), return that spell name.
If the input does not explicitly mention any known spell by name, return null.

Respond only with valid JSON.

Examples:

Input: I want to cast fireball at the enemy
Output: { "spell": "fireball" }

Input: give me rage mode
Output: { "spell": "rage" }

Input: make me super angry and strong
Output: { "spell": null }

Input: unleash a fire explosion
Output: { "spell": null }`
    }]
  }
});

// Main function that receives user input and returns the model's raw JSON text response
export async function detectSpell(userInput) {
  const result = await chat.sendMessage(userInput); // send the user sentence to the Gemini chat
  const response = result.response; // extract the response object
  return response.text(); // return the raw JSON string
}
