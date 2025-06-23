import * as Game from "./Game.js"; // import the objects from the objects.js file
import * as Objects from "./objects.js"; // import the objects from the objects.js file
import { devLevels } from './dev_levels.js';

class LevelEditorLogic {
    constructor(...args) {
        switch (args.length) {
            // in this case, we create the default board
            case 3:
                this.defaultConstructor(args[0], args[1], args[2]);
                break;
            // in this case, we create the board from a json file which we get the data from
            case 1:
                this.levelJsonString= args[0]
                this.fromJson()
                break;
            default:
                console.error("Invalid number of arguments for LevelEditorLogic constructor.");
                break;
        }
    }

    
    defaultConstructor(boardSize, cellSize, initialMana) {
        this.initialMana=initialMana;
        this.levelEditorActive=true;
        this.deleteMode = false;
        this.levelLogic= new Game.LevelLogic(boardSize, cellSize, initialMana, true);
        this.levelLogic.board.boardActive=false;

        this.waitingForDoorClick = false;
        this.tempButtonX = -1;
        this.tempButtonY = -1;

        this.playerInitialX= Math.ceil(boardSize / 2);
        this.playerInitialY= Math.ceil(boardSize / 2);
        
        this.choosePlayerLocation = false;
        window.lvLogic = this.levelLogic;

        this.objectsList =[]
        this.updateLevelJsonString(); 

        this.levelLogic.addKeyboardListener();
        this.createGrid();
        this.addButtons();
        this.handleGridClicks()
    }


    // this function is called when we want to load a level from a json file
    fromJson() {
        // Clean up existing elements
        document.querySelectorAll('.grid').forEach(el => el.remove());

        // Create grid before adding objects
        this.createGrid();
        this.levelLogic= Game.loadLevelFromJson(this.levelJsonString);
        const jsonData = JSON.parse(this.levelJsonString);
        this.initialMana = jsonData.initialMana;
        this.playerInitialX = jsonData.playerInitialX;
        this.playerInitialY = jsonData.playerInitialY;
        this.objects= jsonData.objectsList;

        Objects.ManaDisp.updateScoreDisplay(this.initialMana);
        
        // Reset editor state
        this.levelEditorActive = true;
        this.deleteMode = false;
        this.waitingForDoorClick = false;
        this.tempButtonX = -1;
        this.tempButtonY = -1;
        this.choosePlayerLocation = false;

        this.handleGridClicks();
        
        // Ensure board is inactive
        this.levelLogic.addKeyboardListener();
        this.levelLogic.board.boardActive = false;
    }

    getSerializableState() {
    return {
        boardSize: this.levelLogic.board.boardSize,
        cellSize: this.levelLogic.board.cellSize,
        initialMana: this.initialMana,
        playerInitialX: this.playerInitialX,
        playerInitialY: this.playerInitialY,
        objectsList: this.objectsList
    };
}
    addObjectToList(type, x, y,doorX=0,doorY=0) {
        this.objectsList.push({
        type: type,
        x: x,
        y: y,
        doorX: doorX,
        doorY: doorY,
    });
    }
    deleteObjectFromList(type, x, y) { 
        // Find the index of the object to remove by type, x, and y
        const indexToDelete = this.objectsList.findIndex(obj => obj.type === type && obj.x === x && obj.y === y);
        if (indexToDelete !== -1) {
            this.objectsList.splice(indexToDelete, 1); // Remove 1 element at this index
        }
    }
    updateLevelJsonString() {
    this.levelJsonString = JSON.stringify(this.getSerializableState(), null, 2);
    }

    exportLevelScript() {
        // create json object to store the level data
        console.log(this.levelJsonString);
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
                this.deleteObjectFromList(this.itemSelector.selectedObjectType,x, y);
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
                        this.addObjectToList("buttonAndDoor",this.tempButtonX,this.tempButtonY,x,y)
                        this.waitingForDoorClick = false;
                    }
                } 
                else {
                    this.levelLogic.board.addObject(this.itemSelector.selectedObjectType, x, y);
                    this.addObjectToList(this.itemSelector.selectedObjectType,x,y)
                }
            }
            this.updateLevelJsonString();
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
        this.addLevelSelector();
        this.addMenuButton();
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
        // Reset editor state before reloading
        this.levelEditorActive = true;
        this.levelLogic.board.boardActive = false;
        // Reinitialize from JSON
        this.fromJson();
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
        button.style.top = "3%";
        button.style.left = "10%";
        button.style.width="600px";
    
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
            this.updateLevelJsonString();
        });

        // Add all elements to the container
        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(button);

        // Add the container to the body
        document.body.appendChild(container);
    }
    addMenuButton() {
        const button = document.createElement("button");
        button.textContent = "Menu";
        button.classList.add('menu-btn');
        button.style.position= "absolute";
        button.style.padding ="20px 30px";
        button.style.top = "1%";
        button.style.left = "1%";
        button.style.height="300px";
        button.style.width="550px";
        button.style.fontSize="195px";
        button.addEventListener("click", () => {    
            window.location.href = 'index.html';
        });
        document.body.appendChild(button);
    }
    addLevelSelector() {
        const container = document.createElement("div");
        container.id = "level-selector-container"; 
        container.style.position = "fixed";
        container.style.top = "70%"; 
        container.style.left = "10%"; 
        container.style.zIndex = "1000";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px"; // Space between elements
        container.style.height="600px";
        container.style.width="600px";

        const label = document.createElement("label");
        label.textContent = "Load Dev Level:";
        label.style.fontSize = "100px";
        label.style.color = "white";
        label.style.height="100px";
        label.style.width="800px";
        container.appendChild(label);

        const select = document.createElement("select");
        select.id = "level-select";
        select.style.height="100px";
        select.style.width="1200px";
        select.style.fontSize = "80px";
        select.style.padding = "5px";
        select.style.textAlign = "center";

        container.appendChild(select);

        // Populate the dropdown with levels from devLevels
        for (let i = 1; i <= 20; i++) {
            const levelKey = `level_${i}`;
            if (devLevels[levelKey]) { // Only add if the level data exists
                const option = document.createElement("option");
                option.value = levelKey;
                option.textContent = `Level ${i}`;
                select.appendChild(option);
            }
        }

        const loadButton = document.createElement("button");
        loadButton.textContent = "Load Selected Level";
        loadButton.classList.add('btn');
        loadButton.style.top = "50%"; 
        loadButton.style.fontSize = "80px";
        loadButton.style.height="200px";
        loadButton.style.width="1000px";
        loadButton.style.padding = "10px 15px";
        loadButton.addEventListener("click", () => {
            if (!this.levelEditorActive) return; // Only load if editor is active
            const levelJsonString = devLevels[select.value];

            if (levelJsonString) {
                try {
                    // Call fromJson to load the level
                    this.levelJsonString = levelJsonString; // Set the string for fromJson
                    this.fromJson();
                    console.log(`Successfully loaded level:`);
                } catch (error) {
                    console.error(`Error parsing JSON for level`, error);
                    // You might want a more user-friendly error display here
                }
            } else {
                console.warn(`No data found for level`);
            }
        });
        container.appendChild(loadButton);

        document.body.appendChild(container);
    }
    
    
}
class itemSelector {
    constructor() {
        this.selectedObjectType = null;

        const objectTypes = ["wall", "wooden_box", "metal_box", "buttonAndDoor","flag"];
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
            btn.style.padding = "50px 50px"; // Bigger button area (vertical 10px, horizontal 20px)
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