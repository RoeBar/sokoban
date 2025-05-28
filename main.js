import * as Game from "./Game.js"; // import the game class

// init the game
const boardSize = 10; // size of the board
const cellSize = Math.min(window.innerWidth, window.innerHeight) / boardSize;
let lvLogic = new Game.LevelLogic(boardSize, cellSize, 20);// Mana=20
lvLogic.addKeyboardListener(); // add the keyboard listener to the logic class

// run the server
const { exec } = require('child_process');

exec('node spell-api-server.mjs', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});

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

