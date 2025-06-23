import * as Objects from "./objects.js"; // import the objects from the objects.js file
import * as module from "./spellmodule.js"; // import the objects from the objects.js file

const WIZARD_IMAGES = [{ base: "images/wizard.png",side: "images/wizard_side.png", up: "images/wizard_up.png"},
                        { base: "images/enraged_wizard.png",side: "images/enraged_wizard_side.png", up: "images/enraged_wizard_up.png"}];


// this function is called when we want to load a level from a json string
export function loadLevelFromJson(levelJsonString) {
    const jsonData = JSON.parse(levelJsonString);

    document.querySelectorAll('.grid').forEach(el => el.remove());
    GameBoard.clearBoard();
    // level logic
    const levelLogic = new LevelLogic(jsonData.boardSize, jsonData.cellSize, jsonData.initialMana);

    levelLogic.mana = jsonData.initialMana;
    levelLogic.playerInitialX = jsonData.playerInitialX;
    levelLogic.playerInitialY = jsonData.playerInitialY;
    levelLogic.board.teleportPlayer(levelLogic.playerInitialX ,levelLogic.playerInitialY);

    // Add objects from JSON
    for (let i = 0; i < jsonData.objectsList.length; i++) {
        let obj = jsonData.objectsList[i];
        levelLogic.board.addObject(obj.type, obj.x, obj.y, 0, 0, obj.doorX, obj.doorY);
    }
    return levelLogic
}



/* a class to handle the logic of the game,
    such as the board and events
*/
class LevelLogic {
    constructor(boardSize, cellSize, mana, Editor=false) {
        this.board = new GameBoard(boardSize, cellSize, Editor);
        this.board.parentLogic = this;
        this.board.createGrid();
        this.mana= mana;
        this.manaDisplay=new Objects.ManaDisp(mana);
        this.projectiles = []; // a list of projectiles
        this.onLevelComplete = null;
        this.keyboardHandler = this.handleKeyDown.bind(this);

        module.addListenerToGame(this);
        this.isSpellCasting= false;
        this.webWorker= module.getWorkerInstance();
    }

    handleKeyDown(event) {
        if (!this.board.boardActive) return; // check if the board is active
        switch (event.key.toLowerCase()) {
            case 'w': this.board.movePlayer(0, -1); break;
            case 's': this.board.movePlayer(0, 1); break;
            case 'a': this.board.movePlayer(-1, 0); break;
            case 'd': this.board.movePlayer(1, 0); break;
            case 'f': this.castSpell("fireball", this.board.playerDirX, this.board.playerDirY); break; // cast fireball spell
            case 'e': this.castSpell("Enraged"); break; // cast fireball spell
            // if the player presses 'k', send a message to the web worker to detect the spell
            case 'k': this.webWorker.postMessage({ msg: "castSpell" }); console.log("detected k"); break; // cast spell
        }
    }

    addKeyboardListener() {
        document.addEventListener('keydown', this.keyboardHandler);
    }

    removeKeyboardListener() {
        // Only remove if the handler was actually attached
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
    }

    castSpell(command, dirX=0, dirY=0) {
        if (command === "rage") {
            command = "Enraged"; // normalize the command to "Enraged"
        }
        switch (command) {
            case "fireball": 
                const fireballCost=3;
                if (!this.checkMana(fireballCost)) break;
                this.board.addObject("fireball", this.board.playerGridX, this.board.playerGridY, dirX, dirY);
                break;
            case "Enraged":
                const enragedCost=2;
                if (!this.checkMana(enragedCost)) break;
                this.board.playerStrength = 2;
                this.board.isEnraged=true;
                this.board.enragedMoves=5;
                break;
            default:
                console.error("Invalid spell type"); // invalid spell type
                return;
        }
    }
    checkMana(spellCost){
        if(this.mana< spellCost) return false;
        this.mana-=spellCost;
        Objects.ManaDisp.updateScoreDisplay(this.mana);
        return true;
    }
}

// a class that handles board management
class GameBoard {
    constructor(boardSize, cellSize, Editor=false) {

        this.boardSize = boardSize;
        this.cellSize = cellSize;
        this.boardWidth = boardSize * cellSize;
        if(Editor){
            this.boardStartX = (window.innerWidth - this.boardWidth) / 2;
        } 
        else this.boardStartX = (window.innerWidth - this.boardWidth) / 4;
        this.boardStartY = (window.innerHeight - this.boardWidth) / 2;

        this.frontBoardState = {};     // maps index to ID for objects in front (like player, boxes, fireballs)
        this.frontIdToObjects = {};    // maps ID to actual object in front

        this.backBoardState = {};      // maps index to ID for background objects (like standable tiles, buttons)
        this.backIdToObjects = {};     // maps ID to actual background object

        this.id = 2; // next id to be used for objects

        this.parentLogic = null;

        this.player = document.getElementsByClassName("player")[0];
        this.initPlayer(); // initialize the player
        this.playerImg = document.getElementsByClassName("playerImg")[0];
        this.isEnraged=false;
        this.playerImg.src=  WIZARD_IMAGES[+this.isEnraged]['base'];

        this.playerStrength = 1; // player strength, used for pushing objects
        this.playerDirX = 1; // player direction, used for spellcasting
        this.playerDirY = 0; // player direction, used for spellcasting
        this.enragedMoves=0;

        this.numberOfPairs=0;

        // flag if boardActive for event handling purposes
        this.boardActive = true;
    }

    initPlayer() {
        this.playerGridX = Math.ceil(this.boardSize / 2);
        this.playerGridY = Math.ceil(this.boardSize / 2);
        const index=GameBoard.twoDIndexTo1d(this.playerGridY, this.boardSize, this.playerGridX);
        this.frontBoardState[index] = 1;
        this.backBoardState[index] = 0;
        this.frontIdToObjects[1] = this.player // map the player to the id 1
        // Now center player in the middle cell
        this.player.style.transform = "scale(0.8)";
        this.player.style.width = this.cellSize + "px";
        this.player.style.height = this.cellSize + "px";
        this.player.style.left = (this.boardStartX + Math.floor(this.boardSize / 2) * this.cellSize) + "px";
        this.player.style.top = (this.boardStartY + Math.floor(this.boardSize / 2) * this.cellSize) + "px";   
    }
    teleportPlayer(x,y) {
        this.playerGridX = x;
        this.playerGridY = y;
        const newLeft = this.boardStartX + this.playerGridX * this.cellSize;
        const newTop = this.boardStartY + this.playerGridY * this.cellSize;
        this.player.style.left = newLeft + "px";
        this.player.style.top = newTop + "px";
    }
    createGrid() {
        if(this.levelEditorActive)return;
        let index = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                let temp = document.createElement("div");
                temp.classList.add("grid");
                temp.style.left = (this.boardStartX + j * this.cellSize) + "px";
                temp.style.top = (this.boardStartY + i * this.cellSize) + "px";
                temp.style.width = this.cellSize + "px";
                temp.style.height = this.cellSize + "px";
                temp.style.position = "absolute";
                document.body.appendChild(temp);
                index = (i * this.boardSize + j);
                this.frontBoardState[index] = 0; // 0 means empty cell
                this.backBoardState[index] = 0; // 0 means empty cell
                // since these aren't objects used for the game, just for the grid, we don't need to store them
            }
        }
    }

    static clearBoard(){
        console.log("%c[GameBoard.clearBoard] --- Starting Board Clear (Nuking All Game Object DIVs) ---", 'color: red; font-weight: bold;');

        // Nuke all elements that were part of a GameObject
        document.querySelectorAll('.game-object').forEach(el => {
            // console.log(`[GameBoard.clearBoard - Nuke] Removing element with ID: ${el.id}`); 
            el.remove();
        });
    }

    checkMove(startX, startY, dirX, dirY) {
        let nextX = startX + dirX;
        let nextY = startY + dirY;
        // check if the move is valid
        if (nextX < 0 || nextX >= this.boardSize || nextY < 0 || nextY >= this.boardSize) {
            return false; // out of bounds
        }
        const nextIndex = GameBoard.twoDIndexTo1d(nextY, this.boardSize, nextX);
        const objId = this.frontBoardState[nextIndex];
        if (objId === 0) return true; // empty cell
        const obj = this.frontIdToObjects[objId];
        if (obj instanceof Objects.Flag) {
            this.removeObject(objId);
            if (this.parentLogic && typeof this.parentLogic.onLevelComplete === 'function') {
                this.parentLogic.onLevelComplete();
            }
            return true;
        }
        return this.handleCollision(this.playerGridX, this.playerGridY, dirX, dirY); // check for collision
    }

    movePlayer(dirX, dirY) {
        // instead of checking coords we can check the index using boardState
        if (!this.checkMove(this.playerGridX, this.playerGridY, dirX, dirY)) return; // check if the move is valid

        if(this.isEnraged){
            this.enragedMoves-=1;
            if(this.enragedMoves==0){
                this.isEnraged=false;
                this.playerStrength = 1;
            } 
        }

        this.UpdateButtonIfPlayerMovment(dirX, dirY);

        this.playerGridX += dirX;
        this.playerGridY += dirY;
        const newLeft = this.boardStartX + this.playerGridX * this.cellSize;
        const newTop = this.boardStartY + this.playerGridY * this.cellSize;
        this.player.style.left = newLeft + "px";
        this.player.style.top = newTop + "px";
        // Set direction based on movement
        this.changeDirection(dirX, dirY);
    }


    handleCollision(currentX, currentY, dirX, dirY) {
        let nextX = currentX + dirX;
        let nextY = currentY + dirY;
        let nextIndex = GameBoard.twoDIndexTo1d(nextY, this.boardSize, nextX);
        const objId = this.frontBoardState[nextIndex];
        const obj = this.frontIdToObjects[objId];

        if (!(obj instanceof Objects.Pushable)) return false; // not a pushable object
        if (obj.weight >= this.playerStrength) return false; // not pushable
        
        // check if the next cell is empty
        let nextNextX = nextX + dirX;
        let nextNextY = nextY + dirY;
        if (nextNextX < 0 || nextNextX >= this.boardSize || nextNextY < 0 || nextNextY >= this.boardSize) return false; // out of bounds
        const nextNextIndex = GameBoard.twoDIndexTo1d(nextNextY, this.boardSize, nextNextX);
        if (this.frontBoardState[nextNextIndex] !== 0) return false; // not empty
        // move the object
        this.moveObjectATile(nextIndex,nextNextIndex,objId, dirX, dirY);
        return true; // moved the object
    }

    moveObjectATile(nextIndex,nextNextIndex,objId, dirX, dirY){
        const nextStandableObjId= this.backBoardState[nextIndex];
        const nextStandableObj = this.backIdToObjects[nextStandableObjId];

        if(nextStandableObj instanceof Objects.Button) {
            nextStandableObj.pressed=false;
            this.UpdateDoor("closed",nextStandableObj.pairNumber);
        }

        const nextNextStandableObjId= this.backBoardState[nextNextIndex];
        const nextNextStandableObj = this.backIdToObjects[nextNextStandableObjId];

        if(nextNextStandableObj instanceof Objects.Button) {
            nextNextStandableObj.pressed=true; 
            this.UpdateDoor("open",nextNextStandableObj.pairNumber);
        }

        this.frontBoardState[nextIndex] = 0; // set the old cell to empty
        this.frontBoardState[nextNextIndex] = objId; // set the new cell to the object id
        const obj = this.frontIdToObjects[objId];
        obj.moveObject(dirX, dirY, this.boardStartX, this.boardStartY, this.cellSize); // move the object
    }

    changeDirection(dirX, dirY) {
        this.playerDirX = dirX; // set the direction
        this.playerDirY = dirY; // set the direction

        if (dirX !== 0) {
            this.playerImg.src = WIZARD_IMAGES[+this.isEnraged]['side']; // facing to the side
            // if facing to the left, flip the image
            this.playerImg.style.transform = "scaleX("+dirX+")"; // facing right
        }
        else if (dirY < 0) {
            this.playerImg.src = WIZARD_IMAGES[+this.isEnraged]['up']; // facing up
        } 
        else {
            this.playerImg.src = WIZARD_IMAGES[+this.isEnraged]['base']; // facing down
            this.playerImg.style.transform = "scale(0.8)"; // facing down
        }
    }

    UpdateButtonIfPlayerMovment(dirX, dirY){
        // update button in current tile
        let index = GameBoard.twoDIndexTo1d(this.playerGridY, this.boardSize, this.playerGridX);
        const StandableObjId= this.backBoardState[index];
        if(StandableObjId!=0) {
            const StandableObj = this.backIdToObjects[StandableObjId];
    
            if(StandableObj instanceof Objects.Button && StandableObj.pressed==true) {
                StandableObj.pressed=false;
                this.UpdateDoor("closed",StandableObj.pairNumber);
            }
        }

        // update button in next tile
        let nextX = this.playerGridX + dirX; 
        let nextY = this.playerGridY + dirY;
        let nextIndex = GameBoard.twoDIndexTo1d(nextY, this.boardSize, nextX);
        const nextStandableObjId= this.backBoardState[nextIndex];
        if(nextStandableObjId!=0) {
            const nextStandableObj = this.backIdToObjects[nextStandableObjId];

            if(nextStandableObj instanceof Objects.Button && nextStandableObj.pressed==false) {
                nextStandableObj.pressed=true;
                this.UpdateDoor("open",nextStandableObj.pairNumber);
        }

        }
    }
    UpdateButtonIfObjectDestroyed(obj){
        // update button in current tile
        let Index = GameBoard.twoDIndexTo1d(obj.y, this.boardSize, obj.x);
        const StandableObjId= this.backBoardState[Index];
        const StandableObj = this.backIdToObjects[StandableObjId];

        if(StandableObj instanceof Objects.Button && StandableObj.pressed==true) {
            StandableObj.pressed=false;
            this.UpdateDoor("closed",StandableObj.pairNumber);
        }

    }
    UpdateDoor(state,pairNumber){
        //update door with this pair number 
        for (const index in this.frontBoardState) {
            const id = this.frontBoardState[index];
            if(id==0) continue;
            const obj = this.frontIdToObjects[id];
        
            if (obj instanceof Objects.Door && obj.pairNumber == pairNumber && state == "open") {
                obj.open=true;
                obj.updateDoorSprite();
                this.frontBoardState[index] = 0;
                this.frontIdToObjects[id] = null;
                this.backBoardState[index] = id;
                this.backIdToObjects[id] = obj;
            }
        }        
        for (const index in this.backBoardState) {
            const id = this.backBoardState[index ];
            if(id==0) continue;
            const obj = this.backIdToObjects[id];

            if (obj instanceof Objects.Door && obj.pairNumber == pairNumber && state == "closed") {
                obj.open=false;
                obj.updateDoorSprite();
                this.backBoardState[index] = 0;
                this.backIdToObjects[id] = null;
                this.frontBoardState[index] = id;
                this.frontIdToObjects[id] = obj ;
            }
        }       
    }
    nextId() {
        this.id++;
        return this.id - 1; // return the next id
    }

    // add a method to add objects to the board
    addObject(type, x, y, dirX=0, dirY=0, secondX=0,secondY=0) {
        const index = GameBoard.twoDIndexTo1d(y, this.boardSize, x);
        if (this.frontBoardState[index] !== 0) return; // check if the cell is empty
        const id = this.nextId(); // get the next id
        this.frontBoardState[index] = id; // set the cell to the id
        switch (type) {
            case "flag":
                this.frontIdToObjects[id] = new Objects.Flag(id, x, y, this.cellSize); // create a new flag object
                break;
            case "wall":
                this.frontIdToObjects[id] = new Objects.Wall(id, x, y, this.cellSize); // create a new wall object
                break;
            case "wooden_box":
                this.frontIdToObjects[id] = new Objects.WoodenBox(id, x, y, this.cellSize); // create a new wooden box object
                break;
            case "metal_box":
                this.frontIdToObjects[id]= new Objects.MetalBox(id, x, y, this.cellSize); // create a new metal box object
                break;
            case "fireball": 
                this.frontIdToObjects[id] = new Objects.Fireball(id, x, y, dirX, dirY, this); // create a new wall object 
                break; 
            case "buttonAndDoor": 
            this.numberOfPairs += 1;
        
            // Create door at (x, y)
            this.frontIdToObjects[id] = new Objects.Door(id, x, y, this.cellSize, this.numberOfPairs);

            // Create button at (secondX, secondY)
            const buttonId = this.nextId();
            this.backBoardState[GameBoard.twoDIndexTo1d(secondY, this.boardSize, secondX)] = buttonId;
            this.backIdToObjects[buttonId]= new Objects.Button(buttonId, secondX, secondY, this.cellSize, this.numberOfPairs);
            this.backIdToObjects[buttonId].moveObject(0, 0, this.boardStartX, this.boardStartY, this.cellSize);
            break;

            default:
                console.error("Invalid object type"); // invalid object type
                return;
        }
        this.frontIdToObjects[id].moveObject(0, 0, this.boardStartX, this.boardStartY, this.cellSize); // move the object to the correct position
    }
    static twoDIndexTo1d(y, size, x) {
        return y * size + x; // convert 2d index to 1d index
    }

    removeObject(id, place=0) {
        if(place== 0){
            const obj = this.frontIdToObjects[id]; // get the object by id
            if (obj === undefined) return; // object not found
            const index = GameBoard.twoDIndexTo1d(obj.y, this.boardSize, obj.x); // get the index of the object
            this.frontBoardState[index] = 0; // set the cell to empty
            delete this.frontIdToObjects[id]; // remove the object from the mapping
            obj.removeObject(); // remove the object from the DOM
        } 
        else {
            const obj = this.backIdToObjects[id]; // get the object by id
            if (obj === undefined) return; // object not found
            const index = GameBoard.twoDIndexTo1d(obj.y, this.boardSize, obj.x); // get the index of the object
            this.backBoardState[index] = 0; // set the cell to empty
            delete this.backIdToObjects[id]; // remove the object from the mapping
            obj.removeObject(); // remove the object from the DOM
        } 
    }

}

export {GameBoard,LevelLogic}