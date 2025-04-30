import express from "express"; // Web framework for creating the HTTP server
import cors from "cors";       // Middleware to enable Cross-Origin Resource Sharing
import { detectSpell } from "./gemini-spell-checker.mjs"; // Function to analyze user input and return spell

const app = express(); // Create Express app instance

app.use(cors()); // Allow requests from any origin
app.use(express.json()); // Automatically parse incoming JSON payloads

// Define POST route for detecting spells
app.post("/detectSpell", async (req, res) => {
  const input = req.body.input; // Extract user input from request body
  try {
    const output = await detectSpell(input); // Call Gemini model to analyze input
    res.json({ result: output }); // Respond with the model's result
  } catch (err) {
    console.error(err); // Log error to console for debugging
    res.status(500).json({ error: err.message }); // Respond with error if something fails
  }
});

// Start listening on port 3000
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
