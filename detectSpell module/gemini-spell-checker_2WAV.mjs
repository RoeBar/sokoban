import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs";
import mic from "mic";  // uses sox so need to run in terminal "npm install Sox-audio"

dotenv.config();        //  set environment variable with gemini API key

/* ------------------------------------------------------------------ */
/* 1 │ helper: record once and resolve with the WAV pathname           */
/* ------------------------------------------------------------------ */
function recordOnce() {
  return new Promise((resolve, reject) => {
    const fileName = `speech.wav`;

    const micInstance = mic({
      rate: "16000",
      channels: "1",
      fileType: "wav",
      exitOnSilence: 2,
      silence: "1 0.1 1% 1 2.0 1%",
      debug: false,
    });

    const micInput = micInstance.getAudioStream();
    const fileStream = fs.createWriteStream(fileName);
    micInput.pipe(fileStream);

    console.log("Speak now (auto-stop after 2 s of silence)…");

    micInput
      .on("silence", () => micInstance.stop())
      .on("stopComplete", () => {
        console.log(`Saved → ${fileName}`);
        resolve(fileName);           // << returns path, no process.exit
      })
      .on("error", reject);

    micInstance.start();
  });
}

/* ------------------------------------------------------------------ */
/* 2 │ Gemini initialisation                                          */
/* ------------------------------------------------------------------ */
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);            // get API key
const model  = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });  // set modal 
const chat   = await model.startChat({                                        // start chat with model + giving start instructions. 
  history: [],
  systemInstruction: {
    role: "system",
    parts: [{ text: `You are a spell recognition system for a fantasy game.

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
Output: { "spell": null }` }],
  },
});

/* ------------------------------------------------------------------ */
/* 3 │ main function: record → send → return JSON                     */
/* ------------------------------------------------------------------ */
export async function detectSpell() {
  const audioPath   = await recordOnce();             // get user audio , wait for file.
  const base64Audio = fs.readFileSync(audioPath, { encoding: "base64" });

  const message = [
    {
      text:
        "This is voice input from the player. " +
        "Transcribe it and apply the same spell-detection rules. " +
        "Respond only with the JSON object as before.",
    },
    {
      inlineData: {
        mimeType: "audio/wav",
        data: base64Audio,
      },
    },
  ];

  const { response } = await chat.sendMessage(message);
  console.log("GEMINI:",response.text());
  return response.text();            // ⇒ `{ "spell": "fireball" }`
}

/* ------------------------------------------------------------------ */
/* 4 │ quick CLI test                                                 */
/* ------------------------------------------------------------------ */

//await detectSpell(); // for debug

