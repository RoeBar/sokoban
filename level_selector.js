import { devLevels } from './dev_levels.js';

function createButtons() {
    const keys = Object.keys(devLevels);
    const container = document.createElement('div');
    container.classList.add('level-selector');

    keys.forEach((key) => {
        if (key.includes("tutorial")) return;

        // Create a div to wrap the button and the arrow for better layout control
        const buttonWrapper = document.createElement('div');
        buttonWrapper.classList.add('button-wrapper');

        const btn = document.createElement('button');
        btn.textContent = key[6];
        btn.classList.add('btn');
        btn.addEventListener('click', () => {
            window.location.href = `game.html?level=${key}`;
        });
        container.appendChild(btn);
        if (btn.textContent=="7") return;
        // Create the arrow element
        const arrow = document.createElement('span');
        arrow.classList.add('arrow');
        arrow.textContent = ' → '; 
        buttonWrapper.appendChild(arrow); // Append arrow to the wrapper
        container.appendChild(buttonWrapper); // Append the wrapper to the main container
    });

    document.body.appendChild(container);
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
createButtons();
