// handle client-side logic for the Sokoban game



const recognition = new SpeechRecognition(); // Create new recognition instance
recognition.lang = "en-US";                  // Set recognition language
recognition.interimResults = false;          // Only return final result
recognition.maxAlternatives = 1;             // Only return top option
// Once speech is recognized, send it to the server
recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript; // Get spoken sentence
  output.textContent = `You said: "${transcript}"`;
  try {
    // Send the transcript to the server for spell detection
    const response = await fetch("http://localhost:3000/detectSpell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: transcript })
    });
    const data = await response.json();
    // send the result back to the parent window
    if (data.result) {
      window.parent.postMessage(data.result, "*"); // Send result to parent window
    } else {
      window.parent.postMessage(null, "*"); // Send null if no spell detected
    }
  } catch (err) {
    window.parent.postMessage({ error: err.message }, "*"); // Send error to parent window
    console.error("Error sending spell detection request:", err);
  }
};
