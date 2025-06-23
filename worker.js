importScripts("./client.js"); // import the Client class from client
// create a client instance
let client = new Client();
// worker.js - Web Worker for processing spells

// handle messages from the main thread
self.addEventListener("message", (event) => {
    const data = event.data; // get the data from the event
    if (data.msg === "castSpell") {
        // send a message to the server to detect the spell
        client.detectSpell().then((result) => {
            // send the result back to the main thread
            self.postMessage(result);
        }
        ).catch((error) => {
            // send an error message back to the main thread
            self.postMessage({ msg: "error", error: error.message });
        });
    }
});


