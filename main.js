import * as Objects from "./objects.js"; // import the objects from the objects.js file

import * as Game from "./Game.js"; // import the game class

const Worker = window.Worker || window.MozWorker || window.webkitWorker; // check for worker support
if (!Worker) {
    console.error("Your browser does not support web workers.");
}

// init the game
const boardSize = 10; // size of the board
const cellSize = Math.min(window.innerWidth, window.innerHeight) / boardSize;

// open another thread to handle server communication
const worker = new Worker("./worker.js"); // create a new web worker

// init the game manager
let lvLogic = new Game.LevelLogic(boardSize, cellSize, 20, worker); // Mana=20

// listen for messages from the web worker
lvLogic.webWorker.addEventListener("message", (event) => {
    const data = event.data; // get the data from the event

    const regex_pattern = "\\{\\s*\"spell\":\\s*\"([a-zA-Z]+)\"\\s*\\}"; // regex pattern to match the spell JSON format
    const regex = new RegExp(regex_pattern);
    const spellMatch = data.match(regex); // match the data against the regex pattern

    if (spellMatch) {
        const spell = spellMatch[1]; // get the spell from the match
        console.log("Spell detected:", spell); // log the detected spell
        lvLogic.castSpell(spell, lvLogic.board.playerDirX, lvLogic.board.playerDirY); // cast the spell in the game logic
        lvLogic.isSpellCasting = false
    } else {
        console.log("No valid spell detected in the message.");
    }
});

lvLogic.addKeyboardListener(); // add the keyboard listener to the logic class

lvLogic.board.addObject("wall", 9, 2); 
lvLogic.board.addObject("wall", 7, 2); 
lvLogic.board.addObject("wall", 7, 1); 
lvLogic.board.addObject("wall", 9, 1); 
lvLogic.board.addObject("wall", 7, 0); 
lvLogic.board.addObject("wall", 9, 0);
lvLogic.board.addObject("buttonAndDoor", 8, 2,0,0, 9,5);

lvLogic.board.addObject("buttonAndDoor", 4, 2,0,0, 7,5);

lvLogic.board.addObject("metal_box", 8, 3); 

lvLogic.board.addObject("wall", 4, 4); 
lvLogic.board.addObject("wooden_box", 3, 2);
lvLogic.board.addObject("wooden_box", 5, 2); 
lvLogic.board.addObject("wooden_box", 7, 7); 
lvLogic.board.addObject("metal_box", 2, 2); 
lvLogic.board.addObject("wall", 6, 2); 

