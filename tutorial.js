import * as Game from "./Game.js"; // import the objects from the objects.js file
import * as Objects from "./objects.js"; // import the objects from the objects.js file
import { devLevels } from './dev_levels.js';

class Tutorial {
    constructor() {
        this.stage=1;
        this.levelLogic=null;
        this.updateTutorial();
        this.addContinueButton();
        this.addBackButton();
        this.addRestartButton();
    }
    addContinueButton() {
        const button = document.createElement("button");
        button.textContent = "Continue";
        button.classList.add('btn');
        button.style.top = "30%";
        button.style.left = "10%";
        button.addEventListener("click", () => {
            this.stage+=1;
            if(this.stage<4){
                this.updateTutorial();
            } 
        });
        document.body.appendChild(button);
    }
    addBackButton() {
        const button = document.createElement("button");
        button.textContent = "Back";
        button.classList.add('btn');
        button.style.top = "50%";
        button.style.left = "10%";
        button.addEventListener("click", () => {
            this.stage-=1;
            if(this.stage>0){
                this.updateTutorial();
            } 
        });
        document.body.appendChild(button);
    }
    addRestartButton() {
        const button = document.createElement("button");
        button.textContent = "Restart";
        button.classList.add('btn');
        button.style.top = "40%";
        button.style.left = "10%";
        button.addEventListener("click", () => {
            this.updateTutorial();
        });
        document.body.appendChild(button);
    }
    updateTutorial()
    {
    this.updateText();
    const levelJsonString = devLevels[`level_tutorial${this.stage}`];
        if (levelJsonString) {
            try {
                if(this.levelLogic) this.levelLogic.removeKeyboardListener()
                this.levelLogic= Game.loadLevelFromJson(levelJsonString);
                this.levelLogic.addKeyboardListener();
                } catch (error) {
                    console.error(`Error parsing JSON for level`, error);
                }
            } 
        else {
            console.warn(`No data found for level`);
        }
    }
    updateText()
    {

    }
}

let tut = new Tutorial();

