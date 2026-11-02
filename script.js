const STORAGE_KEY = "number-guessing-game.players.v1";

let lowerRange;
let upperRange;
let secretNumber;
let counter;
let players;
let activeUsername = "";

const loginPanel = document.getElementById("login-panel");
const gamePanel = document.getElementById("game-panel");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username-input");
const loginMessage = document.getElementById("login-message");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const playerName = document.getElementById("player-name");
const gamesWonLabel = document.getElementById("games-won");
const bestScoreLabel = document.getElementById("best-score");
const instructionLabel = document.getElementById("instruction-label");
const feedbackLabel = document.getElementById("feedback-label");
const counterLabel = document.getElementById("counter-label");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const submitBtn = document.getElementById("submit-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const scoreHistory = document.getElementById("score-history");
const historyCount = document.getElementById("history-count");
const emptyHistory = document.getElementById("empty-history");
const storageMessage = document.getElementById("storage-message");

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function readPlayers() {
    try {
        const storedPlayers = localStorage.getItem(STORAGE_KEY);
        const parsedPlayers = storedPlayers ? JSON.parse(storedPlayers) : {};
        if (!parsedPlayers || Array.isArray(parsedPlayers) || typeof parsedPlayers !== "object") {
            throw new Error("Saved player data has an invalid format.");
        }
        const safePlayers = Object.create(null);
        for (const [key, player] of Object.entries(parsedPlayers)) {
            if (!player || typeof player.username !== "string" || !Array.isArray(player.scores)
                || !player.scores.every(score => score
                    && Number.isSafeInteger(score.guesses) && score.guesses > 0
                    && typeof score.playedAt === "string" && !Number.isNaN(Date.parse(score.playedAt))
                    && Number.isSafeInteger(score.lowerRange) && Number.isSafeInteger(score.upperRange))) {
                throw new Error("Saved player data has an invalid format.");
            }
            safePlayers[key] = player;
        }
        return safePlayers;
    } catch (error) {
        loginMessage.textContent = `Unable to load saved players: ${error.message}`;
        loginMessage.className = "message error";
        loginBtn.disabled = true;
        return null;
    }
}

function savePlayers() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
        return true;
    } catch (error) {
        storageMessage.textContent = `Your score could not be saved: ${error.message}`;
        loginMessage.textContent = `Player data could not be saved: ${error.message}`;
        loginMessage.className = "message error";
        return false;
    }
}

function renderPlayerStats() {
    const scores = players[activeUsername].scores;
    gamesWonLabel.textContent = String(scores.length);
    bestScoreLabel.textContent = scores.length
        ? `${scores.reduce((best, score) => Math.min(best, score.guesses), Infinity)} guesses`
        : "—";
    historyCount.textContent = `${scores.length} ${scores.length === 1 ? "game" : "games"}`;
    emptyHistory.classList.toggle("hidden", scores.length > 0);
    scoreHistory.replaceChildren();

    scores.slice(-8).reverse().forEach(score => {
        const item = document.createElement("li");
        const result = document.createElement("strong");
        const details = document.createElement("span");
        const date = new Date(score.playedAt);

        result.textContent = `${score.guesses} ${score.guesses === 1 ? "guess" : "guesses"}`;
        details.textContent = `${date.toLocaleDateString()} · range ${score.lowerRange}–${score.upperRange}`;
        item.append(result, details);
        scoreHistory.append(item);
    });
}

function startNewGame() {
    lowerRange = getRandomInt(0, 50);
    upperRange = getRandomInt(51, 100);
    secretNumber = getRandomInt(lowerRange, upperRange);
    counter = 0;

    instructionLabel.textContent = `Guess a number between ${lowerRange} and ${upperRange}.`;
    feedbackLabel.textContent = "Good luck!";
    feedbackLabel.className = "message";
    counterLabel.textContent = "Guesses: 0";
    guessInput.value = "";
    guessInput.disabled = false;
    submitBtn.disabled = false;
    playAgainBtn.classList.add("hidden");
    guessInput.focus();
}

function showGame(username) {
    activeUsername = username;
    playerName.textContent = players[username].username;
    loginPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
    storageMessage.textContent = "";
    renderPlayerStats();
    startNewGame();
}

function handleLogin(event) {
    event.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) {
        loginMessage.textContent = "Please enter a username.";
        loginMessage.className = "message error";
        return;
    }

    const key = username.toLowerCase();
    if (!players[key]) {
        players[key] = { username, scores: [] };
        if (!savePlayers()) {
            delete players[key];
            return;
        }
    }
    loginMessage.textContent = "";
    showGame(key);
}

function handleGuess(event) {
    event.preventDefault();
    const inputValue = guessInput.value.trim();
    const userGuess = Number(inputValue);
    if (!inputValue || !Number.isSafeInteger(userGuess)) {
        feedbackLabel.textContent = "Enter a whole number to make a guess.";
        feedbackLabel.className = "message error";
        return;
    }

    counter++;
    counterLabel.textContent = `Guesses: ${counter}`;
    if (userGuess === secretNumber) {
        feedbackLabel.textContent = `Correct! ${secretNumber} was the secret number.`;
        feedbackLabel.className = "message correct";
        guessInput.disabled = true;
        submitBtn.disabled = true;

        players[activeUsername].scores.push({
            guesses: counter,
            playedAt: new Date().toISOString(),
            lowerRange,
            upperRange
        });
        if (savePlayers()) {
            storageMessage.textContent = "";
        }
        renderPlayerStats();
        playAgainBtn.classList.remove("hidden");
    } else {
        const tooHigh = userGuess > secretNumber;
        feedbackLabel.textContent = tooHigh ? "Too high! Try again." : "Too low! Try again.";
        feedbackLabel.className = `message ${tooHigh ? "too-high" : "too-low"}`;
        guessInput.value = "";
        guessInput.focus();
    }
}

function switchPlayer() {
    activeUsername = "";
    gamePanel.classList.add("hidden");
    loginPanel.classList.remove("hidden");
    loginMessage.textContent = "";
    usernameInput.value = "";
    usernameInput.focus();
}

players = readPlayers();
if (players) {
    loginForm.addEventListener("submit", handleLogin);
    guessForm.addEventListener("submit", handleGuess);
    playAgainBtn.addEventListener("click", startNewGame);
    logoutBtn.addEventListener("click", switchPlayer);
    usernameInput.focus();
}
