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
        return worker; // return the worker instance
    } catch (error) {
        console.error("Error initializing worker:", error);
        return null; // return null if there was an error
    }
}

export function addListenerToGame(game) {
    // listen for messages from the web worker
    game.webWorker.addEventListener("message", (event) => {
        const data = event.data; // get the data from the event

        const regex_pattern = "\\{\\s*\"spell\":\\s*\"([a-zA-Z]+)\"\\s*\\}"; // regex pattern to match the spell JSON format
        const regex = new RegExp(regex_pattern);
        const spellMatch = data.match(regex); // match the data against the regex pattern

        if (spellMatch) {
            const spell = spellMatch[1]; // get the spell from the match
            console.log("Spell detected:", spell); // log the detected spell
            game.castSpell(spell, game.board.playerDirX, game.board.playerDirY); // cast the spell in the game logic
            game.isSpellCasting = false
        } else {
            console.log("No valid spell detected in the message.");
        }
    });
}

export function removeListenerToGame(game) {
    if (game.webWorker) {
        game.webWorker.removeEventListener("message", game.messageHandler);
    }
}

export function createMenu() {
    // Create the Play button
    const playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.style.top = "42%";
    playButton.style.left = "48%";
    playButton.classList.add('menu-btn');
    playButton.addEventListener("click", () => {
        window.location.href = "level_selector.html"; 
    });
    document.body.appendChild(playButton);

     // Create the how to play button
    const howToPlayButton = document.createElement("button");
    howToPlayButton.textContent = "How to Play";
    howToPlayButton.classList.add('menu-btn');
    howToPlayButton.style.top = "54%";
    howToPlayButton.addEventListener("click", () => {
        window.location.href = "tutorial.html";
    });
    document.body.appendChild(howToPlayButton);

    // Create the Level Editor button
    const levelEditorButton = document.createElement("button");
    levelEditorButton.textContent = "Level Editor";
    levelEditorButton.classList.add('menu-btn');
    levelEditorButton.style.top = "66%";
    levelEditorButton.addEventListener("click", () => {
        window.location.href = "level_editor.html";
    });

    document.body.appendChild(levelEditorButton);
}

