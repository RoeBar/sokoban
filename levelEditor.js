import * as Game from "./Game.js"; // import the objects from the objects.js file
import * as Objects from "./objects.js"; // import the objects from the objects.js file

class LevelEditorLogic {
    constructor(options) {
        switch (options.length) {
            // in this case, we create the default board
            case 3:
                this.defaultConstructor(arguments[0], arguments[1], arguments[2]);
                break;
            // in this case, we create the board from a json file which we get the data from
            case 1:
                this.fromJson(options)
                break;
            default:
                console.error("Invalid number of arguments for LevelEditorLogic constructor.");
                break;
        }
    }
    // add
    
    defaultConstructor(boardSize, cellSize, initialMana) {
        this.initialMana=initialMana;
        this.levelEditorActive=true;
        this.deleteMode = false;
        this.levelLogic= new Game.LevelLogic(boardSize, cellSize, initialMana);
        this.levelLogic.board.boardActive=false;

        this.waitingForDoorClick = false;
        this.tempButtonX = -1;
        this.tempButtonY = -1;

        this.playerInitialX= Math.ceil(boardSize / 2);
        this.playerInitialY= Math.ceil(boardSize / 2);
        
        this.choosePlayerLocation = false;
        window.lvLogic = this.levelLogic;
        this.editorScriptLines = [];

        this.levelLogic.addKeyboardListener();
        this.createGrid();
        this.addButtons();
        this.handleGridClicks()
    }

    // this function is called when we want to load a level from a json file
    fromJson(jsonData) {
        // parse the json data and create the level logic object
        this.levelLogic = new Game.LevelLogic(jsonData.boardSize, jsonData.cellSize, jsonData.initialMana);
        this.levelLogic.board.boardActive=false;
        this.levelLogic.board.clearboard();
        this.levelLogic.mana = jsonData.initialMana;
        this.initialMana=jsonData.initialMana;
        this.playerInitialX=jsonData.playerInitialX;
        this.playerInitialY=jsonData.playerInitialY;
        this.levelLogic.board.teleportPlayer(this.playerInitialX,this.playerInitialY);
        this.levelEditorActive=true;
        this.deleteMode = false;
        this.waitingForDoorClick = false;
        this.tempButtonX = -1;
        this.tempButtonY = -1;
        this.choosePlayerLocation = false;
        this.editorScriptLines = [];
        this.levelLogic.addKeyboardListener();
        // now iterate over the objects in the json data and add them to the board
        for (let i = 0; i < jsonData.objects.length; i++) {
            let obj = jsonData.objects[i];
            if (obj.isBackLayer) {
                this.levelLogic.board.addObject(obj.type, obj.x, obj.y, 0, 0, obj.doorX, obj.doorY);
            } 
            else {
                this.levelLogic.board.addObject(obj.type, obj.x, obj.y);
            }
        }
        // now create the grid and add the buttons
        this.createGrid();
        this.addButtons();
        this.handleGridClicks()
    }

    exportLevelScript() {
        // create json object to store the level data
        let levelData = {
            boardSize: this.levelLogic.board.boardSize,
            playerInitialX: this.playerInitialX,
            playerInitialY: this.playerInitialY,
            initialMana: this.initialMana,
            objects: []
        };
        // such as walls, boxes, and the player
        for (let [key, value] of Object.entries(this.levelLogic.board.frontBoardState)) {
            if (value != 0) {
                levelData.objects.push({ type: value, x: key % this.levelLogic.board.boardSize, y: Math.floor(key / this.levelLogic.board.boardSize) });
            }
        }
        // the backBoardState stores the objects in the back layer of the board, doors
        for (let [key, value] of Object.entries(this.levelLogic.board.backBoardState)) {
            if (value != 0) {
                levelData.objects.push({ type: value, x: key % this.levelLogic.board.boardSize, y: Math.floor(key / this.levelLogic.board.boardSize), isBackLayer: true });
            }
        }
        // now save the level data to a json file 
        // TODO: implement this
        // for now, just print the level data to the console
        const script = this.editorScriptLines.join("\n");
        console.log(script); // or copy to clipboard / download
    }
    
    createGrid() {
        let index = 0;
        let boardSize=this.levelLogic.board.boardSize;
        let cellSize= this.levelLogic.board.cellSize; 

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                let temp = document.createElement("div");
                temp.classList.add("grid"); // used to select later
                temp.dataset.x = j; // add x coordinate
                temp.dataset.y = i; // add y coordinate
                // Style the tile
                temp.style.left = (this.levelLogic.board.boardStartX + j *  cellSize) + "px";
                temp.style.top = (this.levelLogic.board.boardStartY + i * cellSize) + "px";
                temp.style.width = cellSize + "px";
                temp.style.height = cellSize + "px";
                temp.style.position = "absolute";
    
                document.body.appendChild(temp);
    
                // Index is row-major order
                index = (i * boardSize + j);
                this.levelLogic.board.frontBoardState[index] = 0;
                this.levelLogic.board.backBoardState[index] = 0;
            }
        }
    }
    handleGridClicks() {
        document.querySelectorAll(".grid").forEach(tile => {
            tile.addEventListener("click", () => {
            if (!this.levelEditorActive) return;
            
            const x = parseInt(tile.dataset.x);
            const y = parseInt(tile.dataset.y);
            let index= y * this.levelLogic.board.boardSize + x;

            if(this.choosePlayerLocation)
            {
                if(this.levelLogic.board.frontBoardState[index]!=0 || this.levelLogic.board.backBoardState[index]!=0) return;
                this.choosePlayerLocation=false;
                this.playerInitialX= x;
                this.playerInitialY= y;
                this.levelLogic.board.teleportPlayer(x,y);
            }
            else if (this.deleteMode) {
                this.levelLogic.board.removeObject(this.levelLogic.board.frontBoardState[index], 0);
                this.levelLogic.board.removeObject(this.levelLogic.board.backBoardState[index], 1);
            }
            else {
                if(!this.itemSelector.selectedObjectType) return;

                // Special case for buttonAndDoor: prompt for door coords
                if (this.itemSelector.selectedObjectType === "buttonAndDoor") {
                    if (!this.waitingForDoorClick) {
                        // First click: save button position
                        this.tempButtonX = x;
                        this.tempButtonY = y;
                        this.waitingForDoorClick = true;
                    } else {
                        // Second click: use current x, y as door, and place the buttonAndDoor
                        this.levelLogic.board.addObject("buttonAndDoor", this.tempButtonX, this.tempButtonY, 0, 0, x, y);
                        this.editorScriptLines.push(`lvLogic.board.addObject("buttonAndDoor", ${this.tempButtonX}, ${this.tempButtonY}, 0, 0, ${x}, ${y});`);
                        this.waitingForDoorClick = false;
                    }
                } 
                else {
                    this.levelLogic.board.addObject(this.itemSelector.selectedObjectType, x, y);
                    this.editorScriptLines.push(`lvLogic.board.addObject("${this.itemSelector.selectedObjectType}", ${x}, ${y});`);
                }
            }
            });
        });
    }

    addButtons() {
        this.itemSelector=new itemSelector();
        this.addExportButton()
        this.addStartButton();
        this.addPauseButton();
        this.addRestartLevelButton()
        this.addDeleteButton();
        this.addManaInput();
        this.addChoosePlayerLocationButton();
    }

    addExportButton() {
        //adding start game button
        const button = document.createElement("button");
        button.classList.add('btn');
        button.textContent = "export level";
        button.style.top = "60%";
        button.style.left = "10%";
        button.addEventListener("click", () => {
            this.exportLevelScript()
        });
        document.body.appendChild(button);
    }

    addStartButton() {
        //adding start game button
        const button = document.createElement("button");
        button.textContent = "play";
        button.classList.add('btn');
        button.style.top = "40%";
        button.style.left = "4%";
        button.addEventListener("click", () => {
            this.levelLogic.board.boardActive= true;
            this.levelEditorActive=false;
        });
        document.body.appendChild(button);
    }
    
    addPauseButton() {
        //adding start game button
        const button = document.createElement("button");
        button.textContent = "pause";
        button.classList.add('btn');
        button.style.top = "40%";
        button.style.left = "10%";
        button.addEventListener("click", () => {
            this.levelLogic.board.boardActive= false;
            this.levelEditorActive=true;
        });
        document.body.appendChild(button);
    }

    addRestartLevelButton() {
        //adding start game button
        const button = document.createElement("button");
        button.textContent = "Restart level";
        button.classList.add('btn');
        button.style.top = "40%";
        button.style.left = "17%";
        button.addEventListener("click", () => {
            this.levelLogic.board.clearboard();
            const script = this.editorScriptLines.join("\n");
            eval(script);

            this.levelLogic.mana = this.initialMana;
            Objects.ManaDisp.updateScoreDisplay(this.initialMana);
            this.levelLogic.board.teleportPlayer(this.playerInitialX,this.playerInitialY);

            this.levelLogic.board.boardActive= false;
            this.levelEditorActive=true;
        });
        document.body.appendChild(button);
    }

    addDeleteButton() {
        const button = document.createElement("button");
        button.textContent = "Delete";
        button.classList.add('btn');
        button.style.top = "30%";
        button.style.left = "10%";
    
        button.addEventListener("click", () => {
            this.deleteMode = !this.deleteMode;
            button.style.backgroundColor = this.deleteMode ? "red" : "white";
        });
    
        document.body.appendChild(button);
    }

    addChoosePlayerLocationButton() {
        const button = document.createElement("button");
        button.textContent = "Choose player location";
        button.classList.add('btn');
        button.style.top = "4%";
        button.style.left = "7%";
    
        button.addEventListener("click", () => {
            if (!this.levelEditorActive) return;
            this.choosePlayerLocation=true;
        });
    
        document.body.appendChild(button);
    }
    addManaInput(){
        // Create a container div for better layout
        const container = document.createElement("div");
        container.style.margin = "20px";
        container.style.position = "fixed";
        container.style.top = "10%";
        container.style.left = "3%";

        // Create the label
        const label = document.createElement("label");
        label.textContent = "Mana:";
        label.style.fontSize = "80px";
        label.style.marginRight = "40px";
        label.style.color= "white";

        // Create the text input
        const input = document.createElement("input");
        input.type = "text";
        input.style.fontSize = "55px";
        input.style.marginRight = "10px";
        input.style.padding = "55px 55px"

        // Create the button
        const button = document.createElement("button");
        button.textContent = "Submit";
        button.classList.add('btn');
        button.style.marginLeft = "30px";
        button.addEventListener("click", () => {
            if (!this.levelEditorActive) return;
            this.levelLogic.mana = input.value;
            this.initialMana= input.value;
            Objects.ManaDisp.updateScoreDisplay(input.value);
        });

        // Add all elements to the container
        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(button);

        // Add the container to the body
        document.body.appendChild(container);

    }
    
    
}
class itemSelector {
    constructor() {
        this.selectedObjectType = null;

        const objectTypes = ["wall", "wooden_box", "metal_box", "buttonAndDoor"];
        const container = document.createElement("div");
        container.id = "object-picker";
        container.style.position = "fixed";
        container.style.top = "20%";
        container.style.left = "1%";
        container.style.zIndex = "1000";

        objectTypes.forEach(type => {
            const btn = document.createElement("button");
            btn.textContent = type;
            btn.setAttribute("data-type", type);
            btn.style.fontSize = "65px";      // Bigger text
            btn.style.padding = "72px 72px"; // Bigger button area (vertical 10px, horizontal 20px)
            btn.style.margin = "10px";        // More space between buttons
            container.appendChild(btn);

            btn.addEventListener("click", () => {
                this.selectedObjectType = type;
            });
        });
        document.body.appendChild(container);
    }
}


const boardSize = 10; // size of the board
const cellSize = Math.min(window.innerWidth, window.innerHeight) / boardSize;
let lvEditorLogic = new LevelEditorLogic(boardSize, cellSize, 30);// Mana=20