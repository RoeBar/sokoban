// client class for the server communication
// the worker class will contain an instance of this class
// and will use it to communicate with the server

class Client {
    constructor() {
        this.serverUrl = "http://localhost:3000/detectSpell"; // URL of the server endpoint
    }

    async detectSpell() {
        try {
            const response = await fetch(this.serverUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ msg: "castSpell" }) // Send a message to the server
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // Parse JSON response
            console.log(data.result)
            return data.result; // Return the result from the server
        } catch (error) {
            console.error("Error detecting spell:", error);
            throw error; // Re-throw error for further handling
        }
    }
}