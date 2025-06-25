class GameObject {
    constructor(id, type, x, y, Size) {
        this.id = id; // unique id for the object
        this.type = type; // type of the object (e.g. player, wall, etc.)
        this.x = x; // x position of the object
        this.y = y; // y position of the object
        this.element = document.createElement("div"); // create a new div for the object
        this.element.classList.add("game-object"); // All game objects will have 'game-object' class
        this.element.classList.add(type); //, add the type as a class
        this.element.style.position = "absolute"; // set the position to absolute
        document.body.appendChild(this.element); // append the element to the body
        this.img = document.createElement("img");
        this.img.style.width = "100%";
        this.img.style.height = "100%";
        this.img.style.objectFit = "contain";
        // this.img.style.backgroundSize = "cover";  // or "cover"
        //this.img.style.backgroundRepeat = "no-repeat";
        //this.img.style.backgroundPosition = "center";
        this.img.style.display = "block"; // removes any unwanted space under the image
        this.element.appendChild(this.img);
    }

    moveObject(dirX, dirY, boardStartX, boardStartY, cellSize) {
        this.x += dirX; // update the x position
        this.y += dirY; // update the y position
        const newLeft = boardStartX + this.x * cellSize; // calculate the new left position
        const newTop = boardStartY + this.y * cellSize; // calculate the new top position
        this.element.style.left = newLeft + "px"; // set the left position
        this.element.style.top = newTop + "px"; // set the top position
    }

    removeObject() {
        this.element.remove(); // remove the element from the DOM
    }
}

export class ManaDisp {
    static scoreElement = null; // Static property to hold the DOM element

    constructor(initialMana) {
        // Create score element if it doesn't exist
        if (!ManaDisp.scoreElement) {
            ManaDisp.scoreElement = document.createElement('div');
            ManaDisp.scoreElement.id = 'mana-display';
            ManaDisp.scoreElement.classList.add('score');
            document.body.appendChild(ManaDisp.scoreElement);
        }

        ManaDisp.scoreElement.textContent = `Current Mana: ${initialMana}`; // Show initial score
    }

    // Update the visual display
    static updateScoreDisplay(mana) {
        if (ManaDisp.scoreElement) {
            ManaDisp.scoreElement.textContent = `Current Mana: ${mana}`;
        } else {
            console.error("Mana display element not initialized.");
        }
    }
}

class Standable extends GameObject {
    constructor(id, type, x, y) {
        super(id, type, x, y); // call the parent constructor
        this.element.style.pointerEvents = "none";
    }
}

// class that represents a generic tile
class Tile extends GameObject {
    constructor(id, type, x, y, cellSize) {
        super(id, type, x, y); // call the parent constructor
        this.element.style.width = cellSize + "px";
        this.element.style.height = cellSize + "px";
        this.element.style.display = "flex";
        this.element.style.justifyContent = "center";
        this.element.style.alignItems = "center";
        this.element.style.backgroundColor = "transparent"; // remove red bg if it's set
        this.element.style.overflow = "hidden"; // avoid scrollbars or bleed
        this.element.style.backgroundImage = "none"; // remove any default background
        this.element.style.pointerEvents = "none";
    }
}

export class Pushable extends Tile { 
    constructor(id, x, y, type, cellSize, weight) {
        super(id, type, x, y, cellSize); // call the parent constructor
        this.weight = weight; // weight changes what you need to push the object
    }
} 

export class Button extends Standable {
    constructor(id, x, y, cellSize, pairNumber) {
        super(id, "button", x, y); // call the parent constructor

        this.pressed= false;
        this.pairNumber=pairNumber;

        this.img.style.transform = "scale(0.8)";
        this.element.style.width = cellSize + "px";
        this.element.style.height = cellSize + "px";
        this.element.style.left = (x * cellSize + cellSize * 0.1) + "px"; // center the button in the cell
        this.element.style.top = (y * cellSize + cellSize * 0.1) + "px"; // center the button in the cell
        this.element.style.position = "absolute";
        this.determineButtonSprite();
    }
    determineButtonSprite(){
        const num= (this.pairNumber-1)%6+1 //mapping to 1-6
        this.img.src ="images/ButtenSet" + num + ".png";
    }
}


export class Door extends GameObject {
    constructor(id, x, y, cellSize, pairNumber) {
        super(id, "Door", x, y); // call the parent constructor

        this.pairNumber=pairNumber;
        this.open=false;

        this.img.style.transform = "scale(1)";
        this.element.style.width = cellSize + "px";
        this.element.style.height = cellSize + "px";
        this.element.style.position = "absolute";
        this.element.style.pointerEvents = "none";
        this.opnImg="";
        this.clsImg="";
        this.determineDoorSprite()
        this.updateDoorSprite();

    }
    determineDoorSprite(){
        const num= (this.pairNumber-1)%6+1 //mapping to 1-6
        this.opnImg= this.img.src = "images/DorOpenSet" + num + ".png";
        this.clsImg= this.img.src = "images/DorClosedSet" + num + ".png";
    }
    updateDoorSprite(){
        if(this.open){
            this.img.src = this.opnImg;
        }
        else {
            this.img.src = this.clsImg;
        }
    }
}

export class Flag extends Tile {
    constructor(id, x, y, cellSize) {
        super(id, "flag", x, y, cellSize); // call the parent constructor
        this.element.style.backgroundImage = 'url("images/flag.png")'; // set the background image
        this.element.style.backgroundSize = "contain";  // or "cover"
        this.element.style.backgroundRepeat = "no-repeat";
        this.element.style.backgroundPosition = "center";
    }
}

export class Wall extends Tile {
    constructor(id, x, y, cellSize) {
        super(id, "wall", x, y, cellSize); // call the parent constructor
        this.element.style.backgroundImage = 'url("images/wall.png")'; // set the background image
        this.element.style.backgroundSize = "contain";  // or "cover"
        this.element.style.backgroundRepeat = "no-repeat";
        this.element.style.backgroundPosition = "center";
    }
}


export class WoodenBox extends Pushable {
    constructor(id, x, y, cellSize) { 
        super(id, x, y,"wood_box", cellSize, 0); // call the parent constructor
        this.img.src = "images/wooden_box.png"; // set the background image
    }
}

export class MetalBox extends Pushable {
    constructor(id, x, y, cellSize) {
        super(id, x, y,"metal_box", cellSize, 1); // call the parent constructor
        this.img.src = "images/metal_box.png"; // set the background image
    }
}

export class Projectile extends GameObject {
    constructor(id, x, y, dirX, dirY,speedMultiplier, type, board) {
        super(id, type, x, y, board.cellSize); // call the parent constructor
        this.dirX = dirX;
        this.dirY = dirY;
        this.board= board;
        this.speedMultiplier = speedMultiplier;
        this.speed = [dirX * speedMultiplier, dirY * speedMultiplier]; // set the speed of the projectile
        this.lastGridX = Math.round(x); 
        this.lastGridY = Math.round(y); 

        this.element.style.width = board.cellSize + "px";
        this.element.style.height = board.cellSize + "px";
        this.element.style.position = "absolute";
    }

    updateProjectile() {
        // Move in fractional steps
        this.x += this.speed[0];
        this.y += this.speed[1];
    
        // Apply pixel-accurate positioning
        const pixelX = this.board.boardStartX + this.x * this.board.cellSize;
        const pixelY = this.board.boardStartY + this.y * this.board.cellSize;

        this.element.style.left = pixelX + "px";
        this.element.style.top = pixelY + "px";
    
        return [this.x, this.y];
    }
    
    startMovement() {
        const move = () => {

            let newX = this.x + this.speed[0];
            let newY = this.y + this.speed[1];

            const gridX = Math.round(newX);
            const gridY = Math.round(newY);

            // Check if out of bounds
            if (gridX < 0 || gridY < 0 || gridX >= this.board.boardSize || gridY >= this.board.boardSize) {
                this.removeFromBoard();
                return;
            }

            // If the fireball moved to a new tile
            if (gridX !== this.lastGridX || gridY !== this.lastGridY) {
                if (!this.handleCollision(gridX,gridY)) return;

                const oldIndex = this.lastGridY * this.board.boardSize + this.lastGridX;
                const newIndex = gridY * this.board.boardSize + gridX;

                // Clear old tile and update new one
                this.board.frontBoardState[oldIndex] = 0;
                this.board.frontBoardState[newIndex] = this.id;

                this.lastGridX = gridX;
                this.lastGridY = gridY;


            }
            this.updateProjectile();

            requestAnimationFrame(move);
        };

        move();
    }


    removeFromBoard() {
        // Remove the fireball from the board state
        const gridX = Math.round(this.x);
        const gridY = Math.round(this.y);
        const index = gridY * this.board.boardSize + gridX;
        
        // Update the board state by setting the grid to empty
        if (this.board.frontBoardState[index] === this.id) {
            this.board.frontBoardState[index] = 0;
        }
        
        this.board.removeObject(this.id);
    }

    handleCollision(gridX,gridY) {
        const index = gridY * this.board.boardSize + gridX;
        const objId = this.board.frontBoardState[index];
        const obj = this.board.frontIdToObjects[objId];
    
        if (!obj || obj === this) return true; // empty tile or self
        return this.collide(obj);
    }
    
    
    collide() {
        throw new Error("collide() not implemented"); // throw an error if collide is not implemented
    }

    static floatToDiscrete(dir) {
        return Math.round(dir);
    }
}

export class Fireball extends Projectile {
    constructor(id, x, y, dirX, dirY, board) {
        super(id, x, y, dirX, dirY, 0.12, "fireball", board); // call the parent constructor, fireball speedMultiplier = 0.12
        this.img.style.transform = "scale(1)";
        this.img.src = "images/fireball.png";
        this.img.style.transform = "rotate(270deg)";

        // Determine direction and set rotation
        if (dirX === 1 && dirY === 0) 
            this.img.style.transform = "rotate(230deg)";  // Right
        if (dirX === -1 && dirY === 0) 
            this.img.style.transform = "rotate(50deg)";// Left
        if (dirX === 0 && dirY === -1) 
            this.img.style.transform = "rotate(140deg)";// Up
        if (dirX === 0 && dirY === 1) 
            this.img.style.transform = "rotate(320deg)"; // Down       

        this.startMovement();
    }
    /**
   * Reduces a sequence of names to initials.
   * @param  {GameObject} otherObj the object to collide with.
   * @return {Boolean}  if the object should be removed or not.
   * @description This function returns what happens when the fireball collides with another object.
   */ 
    collide(otherObj) {
        if (otherObj instanceof WoodenBox) {
            // Remove the box from the board and DOM
            this.board.removeObject(otherObj.id);
            this.board.UpdateButtonIfObjectDestroyed(otherObj);
            this.removeFromBoard(); // Remove the fireball
            return false;  // Return false if the fireball collides with a wooden box
        }
        if (otherObj instanceof MetalBox || otherObj instanceof Wall) {
            // Remove the fireball if it hits a metal box or wall
            this.removeFromBoard();
            return false;  // Return false if the fireball collides with a metal box or wall
        }
        
        return true;
    }
}
