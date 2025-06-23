// A top-level variable to hold the CURRENTLY active LevelLogic instance
// This variable will be updated whenever a new level is loaded
let workerInstance= null;

// Function to initiate the worker

export function initWorker(workerPath) {
    if (!workerPath) {
        console.error("Worker path is not provided.");
        return null;
    }
    const Worker = window.Worker || window.MozWorker || window.webkitWorker; // check for worker support
    if (!Worker) {
        console.error("Your browser does not support web workers.");
    }
    try {
        const worker = new Worker(workerPath); // create a new worker instance
        console.log("Worker initialized successfully.");
        return worker; // return the worker instance
    } catch (error) {
        console.error("Error initializing worker:", error);
        return null; // return null if there was an error
    }
}


// This function is called only at application start
export function addListenerToGame(level_logic) {
    // listen for messages from the web worker
    level_logic.webWorker.addEventListener("message", (event) => {
        const data = event.data; // get the data from the event

        const regex_pattern = "\\{\\s*\"spell\":\\s*\"([a-zA-Z]+)\"\\s*\\}"; // regex pattern to match the spell JSON format
        const regex = new RegExp(regex_pattern);
        const spellMatch = data.match(regex); // match the data against the regex pattern

        if (spellMatch) {
            const spell = spellMatch[1]; // get the spell from the match
            console.log("Spell detected:", spell); // log the detected spell
            level_logic.castSpell(spell, level_logic.board.playerDirX, level_logic.board.playerDirY); // cast the spell in the game logic
            level_logic.isSpellCasting = false
        } else {
            console.log("No valid spell detected in the message.");
        }
    });
}

export function getWorkerInstance() {
    console.log("worker given")
    return workerInstance;
}