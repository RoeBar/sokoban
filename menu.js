import * as module from "./spellmodule.js"; // import the objects from the objects.js file
function createMenu() {
    // Create the Play button
    const playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.style.top = "42%";
    playButton.style.left = "48%";
    playButton.classList.add('menu-btn');
    playButton.addEventListener("click", () => {
        window.location.href = "level_selector.html"; 
    });
    document.body.appendChild(playButton);

     // Create the how to play button
    const howToPlayButton = document.createElement("button");
    howToPlayButton.textContent = "How to Play";
    howToPlayButton.classList.add('menu-btn');
    howToPlayButton.style.top = "54%";
    howToPlayButton.addEventListener("click", () => {
        window.location.href = "tutorial.html";
    });
    document.body.appendChild(howToPlayButton);

    // Create the Level Editor button
    const levelEditorButton = document.createElement("button");
    levelEditorButton.textContent = "Level Editor";
    levelEditorButton.classList.add('menu-btn');
    levelEditorButton.style.top = "66%";
    levelEditorButton.addEventListener("click", () => {
        window.location.href = "level_editor.html";
    });

    document.body.appendChild(levelEditorButton);
}

//create the menu
createMenu();
module.initWorker("./worker.js");
