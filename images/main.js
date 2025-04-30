import * as Objects from "./objects.js"; // import the objects from the objects.js file

/* a class to handle the logic of the game,
    such as the board and events
*/
class LevelLogic {
    constructor(boardSize, cellSize) {
        this.board = new GameBoard(boardSize, cellSize);
        console.log("gg");
        this.board.createGrid();
        this.projectiles = []; // a list of projectiles
    }

    addKeyboardListener() {
        document.addEventListener('keydown', (event) => {
            if (!this.board.boardActive) return; // check if the board is active
            switch (event.key.toLowerCase()) {
                case 'w': this.board.movePlayer(0, -1); break;
                case 's': this.board.movePlayer(0, 1); break;
                case 'a': this.board.movePlayer(-1, 0); break;
                case 'd': this.board.movePlayer(1, 0); break;
                case ' ': this.castSpell("fireball", this.board.playerDirX, this.board.playerDirY); break; // cast fireball spell
                case 'e': this.castSpell("Enraged"); break; // cast fireball spell
            }
        });
    }

    castSpell(command, dirX=0, dirY=0) {
        if (!this.board.boardActive) return; // check if the board is active
        switch (command) {
            case "fireball": 
                this.board.addObject("fireball", this.board.playerGridX, this.board.playerGridY, dirX, dirY);
                break;
            case "Enraged":
                this.board.playerStrength = 2;
                this.board.isEnraged=true;
                this.board.enragedMoves=5;
                //adding enraged animation
                break;
            default:
                console.error("Invalid spell type"); // invalid spell type
                return;
        }
    }
}

// a class that handles board management
class GameBoard {
    constructor(boardSize, cellSize) {
        this.boardSize = boardSize;
        this.cellSize = cellSize;
        this.boardWidth = boardSize * cellSize;
        this.boardStartX = (window.innerWidth - this.boardWidth) / 2;
        this.boardStartY = (window.innerHeight - this.boardWidth) / 2;
        this.boardState = {}; // a mapping of index to object id, 0 if empty
        this.idToObjects = {}; // a mapping of ids to objects
        this.id = 2; // next id to be used for objects

        this.player = document.getElementsByClassName("player")[0];
        this.initPlayer(); // initialize the player
        this.playerImg = document.getElementsByClassName("playerImg")[0];

        this.playerStrength = 1; // player strength, used for pushing objects
        this.playerDirX = 1; // player direction, used for spellcasting
        this.playerDirY = 0; // player direction, used for spellcasting
        this.isEnraged=false;
        this.enragedMoves=0;

        this.numberOfPairs=0;

        // flag if boardActive for event handling purposes
        this.boardActive = true;
    }

    initPlayer() {
        this.playerGridX = Math.ceil(this.boardSize / 2);
        this.playerGridY = Math.ceil(this.boardSize / 2);
        this.boardState[GameBoard.twoDIndexTo1d(this.playerGridY, this.boardSize, this.playerGridX)] = [1,0]; // 1 means player is in the cell
        this.idToObjects[1] = [this.player,null]; // map the player to the id 1
        // Now center player in the middle cell
        this.player.style.width = this.cellSize + "px";
        this.player.style.height = this.cellSize + "px";
        this.player.style.left = (this.boardStartX + Math.floor(this.boardSize / 2) * this.cellSize) + "px";
        this.player.style.top = (this.boardStartY + Math.floor(this.boardSize / 2) * this.cellSize) + "px";   
    }
    createGrid() {
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
                this.boardState[index] = [0, 0]; // 0 means empty cell
                // since these aren't objects used for the game, just for the grid, we don't need to store them
            }
        }
    }

    checkMove(startX, startY, dirX, dirY) {
        let nextX = startX + dirX;
        let nextY = startY + dirY;
        // check if the move is valid
        if (nextX < 0 || nextX >= this.boardSize || nextY < 0 || nextY >= this.boardSize) {
            return false; // out of bounds
        }
        const nextIndex = GameBoard.twoDIndexTo1d(nextY, this.boardSize, nextX);
        if (this.boardState[nextIndex][0] === 0 ) return true; // empty cell
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
        const objId = this.boardState[nextIndex][0];
        const obj = this.idToObjects[objId][0];

        if (!(obj instanceof Objects.Pushable)) return false; // not a pushable object
        if (obj.weight >= this.playerStrength) return false; // not pushable
        
        // check if the next cell is empty
        let nextNextX = nextX + dirX;
        let nextNextY = nextY + dirY;
        if (nextNextX < 0 || nextNextX >= this.boardSize || nextNextY < 0 || nextNextY >= this.boardSize) return false; // out of bounds
        const nextNextIndex = GameBoard.twoDIndexTo1d(nextNextY, this.boardSize, nextNextX);
        if (this.boardState[nextNextIndex][0] !== 0) return false; // not empty
        // move the object
        this.moveObjectATile(nextIndex,nextNextIndex,objId, dirX, dirY);
        return true; // moved the object
    }
    moveObjectATile(nextIndex,nextNextIndex,objId, dirX, dirY){
        const nextNextStandableObjId= this.boardState[nextNextIndex][1];
        const nextNextStandableObj = this.idToObjects[nextNextStandableObjId][1];

        if(nextNextStandableObj instanceof Objects.Button) {
            nextNextStandableObj.pressed=true;
            this.UpdateDoor("open",nextNextStandableObj.pairNumber);
        }

        this.boardState[nextIndex][0] = 0; // set the old cell to empty
        this.boardState[nextNextIndex][0] = objId; // set the new cell to the object id
        obj.moveObject(dirX, dirY, this.boardStartX, this.boardStartY, this.cellSize); // move the object
    }

    changeDirection(dirX, dirY) {
        if (dirX !== 0) {
            this.playerImg.src = "images/wizard_side.png"; // facing to the side
            // if facing to the left, flip the image
            this.playerImg.style.transform = "scaleX("+dirX+")"; // facing right
        }
        if (dirY < 0) {
            this.playerImg.src = "images/wizard_up.png"; // facing up
        } 
        this.playerImg.src = "images/wizard.png"; // facing down
        this.playerDirX = dirX; // set the direction
        this.playerDirY = dirY; // set the direction
    }

    UpdateButtonIfPlayerMovment(dirX, dirY){
        // update button in current tile
        let Index = GameBoard.twoDIndexTo1d(this.playerGridY, this.boardSize, this.playerGridX);
        const StandableObjId= this.boardState[Index][1];
        const StandableObj = this.idToObjects[StandableObjId][1];

        if(StandableObj instanceof Objects.Button && StandableObj.pressed==true) {
            StandableObj.pressed=false;
            this.UpdateDoor("closed",StandableObj.pairNumber);
        }

        // update button in next tile
        let nextX = this.playerGridX + dirX; 
        let nextY = this.playerGridY + dirY;
        let nextIndex = GameBoard.twoDIndexTo1d(nextY, this.boardSize, nextX);
        const nextStandableObjId= this.boardState[nextIndex][1];
        const nextStandableObj = this.idToObjects[nextStandableObjId][1];

        if(nextStandableObj instanceof Objects.Button && nextStandableObj.pressed==false) {
            nextStandableObj.pressed=true;
            this.UpdateDoor("open",nextStandableObj.pairNumber);
        }
    }
    UpdateButtonIfObjectDestroyed(obj){
        // update button in current tile
        let Index = GameBoard.twoDIndexTo1d(obj.y, this.boardSize, obj.x);
        const StandableObjId= this.boardState[Index][1];
        const StandableObj = this.idToObjects[StandableObjId][1];

        if(StandableObj instanceof Objects.Button && StandableObj.pressed==true) {
            StandableObj.pressed=false;
            this.UpdateDoor("closed",StandableObj.pairNumber);
        }

    }
    UpdateDoor(state,pairNumber){
        //update door with this pair number
        for (const key in this.boardState) {
            const id = this.boardState[key][0];
            const obj = this.idToObjects[id][0];
        
            if (obj instanceof Objects.Door && obj.pairNumber === pairNumber && state === "open") {
                obj.open=true;
                obj.updateDoorSprite();
                this.boardState[key][0] = 0;
                this.boardState[key][1] = id;
            }
        
            const standableId = this.boardState[key][1];
            const standableObj = this.idToObjects[standableId][1];
        
            if (standableObj instanceof Objects.Door && standableObj.pairNumber === pairNumber && state === "closed") {
                standableObj.open=false;
                standableObj.updateDoorSprite();
                this.boardState[key][1] = 0;
                this.boardState[key][0] = standableId;
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
        if (this.boardState[index][0] !== 0) return; // check if the cell is empty
        const id = this.nextId(); // get the next id
        this.boardState[index][0] = id; // set the cell to the id
        switch (type) {
            case "wall":
                this.idToObjects[id] = [new Objects.Wall(id, x, y, this.cellSize),null]; // create a new wall object
                break;
            case "wooden_box":
                this.idToObjects[id] = [new Objects.WoodenBox(id, x, y, this.cellSize),null]; // create a new wooden box object
                break;
            case "metal_box":
                this.idToObjects[id]= [new Objects.MetalBox(id, x, y, this.cellSize),null]; // create a new metal box object
                break;
            case "fireball": 
                this.idToObjects[id] = [new Objects.Fireball(id, x, y, dirX, dirY, this),null]; // create a new wall object 
                break; 
            case "buttonAndDoor": 
            this.numberOfPairs += 1;
        
            // Create door at (x, y)
            this.idToObjects[id] = [new Objects.Door(id, x, y, this.cellSize, this.numberOfPairs),null];

            // Create button at (secondX, secondY)
            const buttonId = this.nextId();
            this.boardState[GameBoard.twoDIndexTo1d(secondY, this.boardSize, secondX)][1] = buttonId;
            this.idToObjects[buttonId]= [null, new Objects.Button(buttonId, secondX, secondY, this.cellSize, this.numberOfPairs)];
            this.idToObjects[buttonId][1].moveObject(0, 0, this.boardStartX, this.boardStartY, this.cellSize);
            break;

            default:
                console.error("Invalid object type"); // invalid object type
                return;
        }
        this.idToObjects[id][0].moveObject(0, 0, this.boardStartX, this.boardStartY, this.cellSize); // move the object to the correct position
    }

    static twoDIndexTo1d(y, size, x) {
        return y * size + x; // convert 2d index to 1d index
    }

    removeObject(id, place=0) {
        const obj = this.idToObjects[id][place]; // get the object by id
        if (obj === undefined) return; // object not found
        const index = GameBoard.twoDIndexTo1d(obj.y, this.boardSize, obj.x); // get the index of the object
        this.boardState[index] = 0; // set the cell to empty
        delete this.idToObjects[id][place]; // remove the object from the mapping
        obj.removeObject(); // remove the object from the DOM
    }

}

// init the game
console.log("banana");
const boardSize = 10; // size of the board
const cellSize = Math.min(window.innerWidth, window.innerHeight) / boardSize;
let lvLogic = new LevelLogic(boardSize, cellSize);
console.log("game started");
lvLogic.addKeyboardListener(); // add the keyboard listener to the logic class
lvLogic.board.addObject("wall", 4, 4); // add an enemy to the board
lvLogic.board.addObject("wooden_box", 3, 2); // add an enemy to the board
lvLogic.board.addObject("wooden_box", 5, 2); // add an enemy to the board
lvLogic.board.addObject("wooden_box", 7, 7); // add an enemy to the board
lvLogic.board.addObject("metal_box", 2, 2); // add an enemy to the board
lvLogic.board.addObject("wall", 6, 2); // add an enemy to the board
