import express from "express"; // Web framework for creating the HTTP server
import cors from "cors";       // Middleware to enable Cross-Origin Resource Sharing
import { detectSpell } from "./gemini-spell-checker_strem.mjs"; // Function to analyze user input and return spell

const app = express(); // Create Express app instance

app.use(cors()); // Allow requests from any origin
app.use(express.json()); // Automatically parse incoming JSON payloads

// Define POST route for detecting spells
app.post("/detectSpell", async (req, res) => {
  try {
    const userInput = req.body; // Get user input from request body
    if (!userInput) {
      return res.status(400).json({ error: "Input is required" }); // Respond with error if input is missing
    }
    else {
      console.log("Received input:", userInput); // Log the received input for debugging
    }
    const output = await detectSpell(); // Call Gemini model to analyze input
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
