import * as Game from './Game.js';
import { devLevels } from './dev_levels.js';

const levelOrder = Object.keys(devLevels);
let currentLevelIndex = 0;
let levelLogic = null;
let title=null;

function loadLevel(index) {
    currentLevelIndex = index;
    const key = levelOrder[index];
    const json = devLevels[key];
    // Clean up existing elements
    if(levelLogic) levelLogic.removeKeyboardListener()
    levelLogic = Game.loadLevelFromJson(json);
    levelLogic.addKeyboardListener();
    updateTitle(key[6]);
    levelLogic.onLevelComplete = showPopup;
}
function addTitle() {
        title= document.createElement("label");
        title.style.fontSize="395px";
        title.classList.add('score');
        title.style.top = "6%";
        title.style.left = "73%";

        document.body.appendChild(title);
}
function updateTitle(level_num) {
        title.textContent = "Level "+ level_num;
}

function addRestartButton() {
    const button = document.createElement("button");
    button.textContent = "Restart level";
    button.classList.add('btn');
    button.style.position= "absolute";
    button.style.top = "30%";
    button.style.left = "77%";
    button.style.height="370px";
    button.style.width="570px";
    button.style.fontSize="140px";
    button.addEventListener("click", () => {    
    loadLevel(currentLevelIndex);
    });
    document.body.appendChild(button);
}

function showPopup() {
    const popup = document.createElement('div');
    popup.id = 'levelPopup';
    popup.classList.add('levelPopup');

    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < levelOrder.length) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next Level'; 
        nextBtn.classList.add('popup-button');
        nextBtn.style.top = "6%";
        nextBtn.style.left = "40%";
        nextBtn.addEventListener('click', () => {
            popup.remove();
            loadLevel(nextIndex);
        });
        popup.appendChild(nextBtn);
    }

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Restart';
    restartBtn.classList.add('popup-button');
    restartBtn.style.top = "30%";
    restartBtn.style.left = "40%";
    restartBtn.addEventListener('click', () => {
        popup.remove();
        loadLevel(currentLevelIndex);
    });
    popup.appendChild(restartBtn);

    const returnBtn = document.createElement('button');
    returnBtn.textContent = 'All Levels';
    returnBtn.classList.add('popup-button');
    returnBtn.style.top = "56%";
    returnBtn.style.left = "40%";
    returnBtn.addEventListener('click', () => {
        window.location.href = 'level_selector.html';
    });
    popup.appendChild(returnBtn);

    document.body.appendChild(popup);
}

function initFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const levelName = params.get('level');
    const idx = levelOrder.indexOf(levelName);
    loadLevel(idx >= 0 ? idx : 0);
}
function addMenuButton() {
    const button = document.createElement("button");
    button.textContent = "Menu";
    button.classList.add('menu-btn');
    button.style.position= "absolute";
    button.style.top = "1%";
    button.style.left = "1%";
    button.style.height="350px";
    button.style.width="570px";
    button.style.fontSize="195px";
    button.addEventListener("click", () => {    
        window.location.href = 'index.html';
    });
    document.body.appendChild(button);
}
addMenuButton();
addTitle();
addRestartButton()
initFromQuery();
