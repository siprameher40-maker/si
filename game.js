const ROWS = 6;
const COLUMNS = 7;
const HUMAN = 1;
const COMPUTER = 2;
const CENTER_FIRST = [3, 2, 4, 1, 5, 0, 6];
const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#game-status");
const statusLabel = document.querySelector("#turn-overline");
const turnIndicator = document.querySelector("#turn-indicator");
const moveCountElement = document.querySelector("#move-count");
const toastElement = document.querySelector("#toast");
const modeComputerButton = document.querySelector("#mode-computer");
const modeFriendButton = document.querySelector("#mode-friend");
const redNameElement = document.querySelector("#red-name");
const yellowNameElement = document.querySelector("#yellow-name");
const redScoreElement = document.querySelector("#red-score");
const yellowScoreElement = document.querySelector("#yellow-score");
const newGameButton = document.querySelector("#new-game");
const resetScoreButton = document.querySelector("#reset-score");
const roundLabel = document.querySelector("#round-label");
const boardNote = document.querySelector("#board-note");

let board = emptyBoard();
let currentPlayer = HUMAN;
let gameMode = "computer";
let gameOver = false;
let thinking = false;
let moveCount = 0;
let selectedColumn = 3;
let roundNumber = 1;
let toastTimeout;
const scores = { [HUMAN]: 0, [COMPUTER]: 0 };

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
}

function buildBoard() {
  boardElement.replaceChildren();

  for (let column = 0; column < COLUMNS; column += 1) {
    const columnElement = document.createElement("div");
    columnElement.className = "column";

    const dropButton = document.createElement("button");
    dropButton.className = "drop-column";
    dropButton.type = "button";
    dropButton.dataset.column = String(column);
    dropButton.setAttribute("aria-label", `Drop a disc in column ${column + 1}`);
    dropButton.addEventListener("click", () => playColumn(column));
    dropButton.addEventListener("focus", () => {
      selectedColumn = column;
      updateSelectedColumn();
    });
    columnElement.append(dropButton);

    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}, empty`);
      cell.innerHTML = '<span class="disc" aria-hidden="true"></span>';
      cell.addEventListener("click", () => playColumn(column));
      columnElement.append(cell);
    }

    boardElement.append(columnElement);
  }
  render();
}

function render(winningCells = []) {
  const winningSet = new Set(winningCells.map(([row, column]) => `${row}:${column}`));

  boardElement.querySelectorAll(".cell").forEach((cell) => {
    const row = Number(cell.dataset.row);
    const column = Number(cell.dataset.column);
    const player = board[row][column];
    cell.dataset.player = String(player);
    cell.disabled = gameOver || thinking || (gameMode === "computer" && currentPlayer === COMPUTER);
    cell.classList.toggle("is-winning", winningSet.has(`${row}:${column}`));
    cell.setAttribute(
      "aria-label",
      `Row ${row + 1}, column ${column + 1}, ${player ? playerName(player) : "empty"}`
    );
  }); 

  boardElement.querySelectorAll(".drop-column").forEach((button) => {
    const column = Number(button.dataset.column);
    button.disabled = gameOver || thinking || (gameMode === "computer" && currentPlayer === COMPUTER)
      || board[0][column] !== 0;
    button.classList.toggle("is-selected", column === selectedColumn);
  });

  moveCountElement.textContent = `${moveCount} ${moveCount === 1 ? "MOVE" : "MOVES"}`;
  redNameElement.textContent = gameMode === "computer" ? "You" : "Red";
  yellowNameElement.textContent = gameMode === "computer" ? "Computer" : "Yellow";
  redScoreElement.textContent = String(scores[HUMAN]);
  yellowScoreElement.textContent = String(scores[COMPUTER]);
  roundLabel.textContent = `ROUND ${String(roundNumber).padStart(2, "0")}`;
  boardNote.textContent = gameMode === "computer" ? "RED STARTS" : "TAKE TURNS";
  updateTurnDisplay();
  updateSelectedColumn();
}

function playerName(player) {
  if (gameMode === "computer") {
    return player === HUMAN ? "you" : "computer";
  }
  return player === HUMAN ? "red" : "yellow";
}

function updateTurnDisplay() {
  turnIndicator.classList.toggle("player-dot-red", currentPlayer === HUMAN);
  turnIndicator.classList.toggle("player-dot-yellow", currentPlayer === COMPUTER);

  if (gameOver) {
    return;
  }

  if (thinking) {
    statusLabel.textContent = "THINKING";
    statusElement.textContent = "Computer is planning…";
  } else if (gameMode === "computer") {
    statusLabel.textContent = currentPlayer === HUMAN ? "YOUR MOVE" : "COMPUTER'S MOVE";
    statusElement.textContent = currentPlayer === HUMAN ? "Your turn" : "Computer's turn";
  } else {
    statusLabel.textContent = `${currentPlayer === HUMAN ? "RED" : "YELLOW"}'S MOVE`;
    statusElement.textContent = `${currentPlayer === HUMAN ? "Red" : "Yellow"}'s turn`;
  }
}

function updateSelectedColumn() {
  boardElement.querySelectorAll(".drop-column").forEach((button) => {
    button.classList.toggle("is-selected", Number(button.dataset.column) === selectedColumn);
  });
}

function playColumn(column) {
  if (gameOver || thinking || (gameMode === "computer" && currentPlayer === COMPUTER)) {
    return;
  }

  const row = landingRow(board, column);
  if (row === -1) {
    showToast("That column is full. Try another one.");
    return;
  }

  placeDisc(row, column, currentPlayer);
}

function placeDisc(row, column, player) {
  board[row][column] = player;
  moveCount += 1;
  selectedColumn = column;
  const winningCells = getWinningCells(board, row, column, player);

  if (winningCells.length > 0) {
    gameOver = true;
    scores[player] += 1;
    render(winningCells);
    statusLabel.textContent = "GAME OVER";
    statusElement.textContent = gameMode === "computer"
      ? player === HUMAN ? "You got four in a row!" : "Computer wins this round"
      : `${player === HUMAN ? "Red" : "Yellow"} wins this round!`;
    showToast(player === HUMAN && gameMode === "computer" ? "Nice one! You connected four." : `${playerName(player)} connected four!`);
    return;
  }

  if (moveCount === ROWS * COLUMNS) {
    gameOver = true;
    render();
    statusLabel.textContent = "GAME OVER";
    statusElement.textContent = "It's a draw!";
    showToast("A perfect tie. Rematch?");
    return;
  }

  currentPlayer = player === HUMAN ? COMPUTER : HUMAN;
  render();

  if (gameMode === "computer" && currentPlayer === COMPUTER) {
    thinking = true;
    render();
    window.setTimeout(makeComputerMove, 430);
  }
}

function makeComputerMove() {
  if (gameOver || gameMode !== "computer" || currentPlayer !== COMPUTER) {
    return;
  }

  const column = chooseComputerMove(board);
  const row = landingRow(board, column);
  if (row === -1) {
    thinking = false;
    render();
    showToast("Couldn't find an open move. Start a new game.");
    return;
  }

  thinking = false;
  placeDisc(row, column, COMPUTER);
}

function landingRow(position, column) {
  if (column < 0 || column >= COLUMNS) {
    return -1;
  }

  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (position[row][column] === 0) {
      return row;
    }
  }
  return -1;
}

function getWinningCells(position, row, column, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [rowStep, columnStep] of directions) {
    const cells = [[row, column]];
    collectDirection(position, row, column, player, rowStep, columnStep, cells);
    collectDirection(position, row, column, player, -rowStep, -columnStep, cells);
    if (cells.length >= 4) {
      return cells;
    }
  }
  return [];
}

function collectDirection(position, row, column, player, rowStep, columnStep, cells) {
  let nextRow = row + rowStep;
  let nextColumn = column + columnStep;

  while (
    nextRow >= 0 && nextRow < ROWS
    && nextColumn >= 0 && nextColumn < COLUMNS
    && position[nextRow][nextColumn] === player
  ) {
    cells.push([nextRow, nextColumn]);
    nextRow += rowStep;
    nextColumn += columnStep;
  }
}

function chooseComputerMove(position) {
  let bestColumn = CENTER_FIRST[0];
  let bestScore = -Infinity;

  for (const column of CENTER_FIRST) {
    const row = landingRow(position, column);
    if (row === -1) {
      continue;
    }
    position[row][column] = COMPUTER;
    const score = minimax(position, 4, -Infinity, Infinity, false);
    position[row][column] = 0;

    if (score > bestScore) {
      bestScore = score;
      bestColumn = column;
    }
  }
  return bestColumn;
}

function minimax(position, depth, alpha, beta, maximizing) {
  const result = evaluatePosition(position);
  if (result !== null) {
    return result;
  }
  if (depth === 0) {
    return scorePosition(position);
  }

  if (maximizing) {
    let value = -Infinity;
    for (const column of CENTER_FIRST) {
      const row = landingRow(position, column);
      if (row === -1) {
        continue;
      }
      position[row][column] = COMPUTER;
      value = Math.max(value, minimax(position, depth - 1, alpha, beta, false));
      position[row][column] = 0;
      alpha = Math.max(alpha, value);
      if (alpha >= beta) {
        break;
      }
    }
    return value;
  }

  let value = Infinity;
  for (const column of CENTER_FIRST) {
    const row = landingRow(position, column);
    if (row === -1) {
      continue;
    }
    position[row][column] = HUMAN;
    value = Math.min(value, minimax(position, depth - 1, alpha, beta, true));
    position[row][column] = 0;
    beta = Math.min(beta, value);
    if (alpha >= beta) {
      break;
    }
  }
  return value;
}

function evaluatePosition(position) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const player = position[row][column];
      if (player && getWinningCells(position, row, column, player).length > 0) {
        return player === COMPUTER ? 100000 : -100000;
      }
    }
  }
  return position[0].every(Boolean) ? 0 : null;
}

function scorePosition(position) {
  let score = 0;

  for (let row = 0; row < ROWS; row += 1) {
    if (position[row][3] === COMPUTER) {
      score += 4;
    } else if (position[row][3] === HUMAN) {
      score -= 4;
    }
  }

  const windows = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column <= COLUMNS - 4; column += 1) {
      windows.push([position[row][column], position[row][column + 1], position[row][column + 2], position[row][column + 3]]);
    }
  }
  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      windows.push([position[row][column], position[row + 1][column], position[row + 2][column], position[row + 3][column]]);
    }
  }
  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let column = 0; column <= COLUMNS - 4; column += 1) {
      windows.push([position[row][column], position[row + 1][column + 1], position[row + 2][column + 2], position[row + 3][column + 3]]);
    }
  }
  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let column = 3; column < COLUMNS; column += 1) {
      windows.push([position[row][column], position[row + 1][column - 1], position[row + 2][column - 2], position[row + 3][column - 3]]);
    }
  }

  for (const window of windows) {
    const computerCount = window.filter((cell) => cell === COMPUTER).length;
    const humanCount = window.filter((cell) => cell === HUMAN).length;
    if (!humanCount) {
      score += [0, 2, 10, 55, 100000][computerCount];
    }
    if (!computerCount) {
      score -= [0, 3, 12, 70, 100000][humanCount];
    }
  }
  return score;
}

function startNewGame(incrementRound = true) {
  if (incrementRound) {
    roundNumber += 1;
  }
  board = emptyBoard();
  currentPlayer = HUMAN;
  gameOver = false;
  thinking = false;
  moveCount = 0;
  selectedColumn = 3;
  statusLabel.textContent = "YOUR MOVE";
  statusElement.textContent = "Your turn";
  buildBoard();
}

function setMode(mode) {
  gameMode = mode;
  modeComputerButton.classList.toggle("is-active", mode === "computer");
  modeFriendButton.classList.toggle("is-active", mode === "friend");
  modeComputerButton.setAttribute("aria-pressed", String(mode === "computer"));
  modeFriendButton.setAttribute("aria-pressed", String(mode === "friend"));
  roundNumber = 0;
  startNewGame();
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastElement.classList.remove("is-visible");
  }, 2200);
}

modeComputerButton.addEventListener("click", () => setMode("computer"));
modeFriendButton.addEventListener("click", () => setMode("friend"));
newGameButton.addEventListener("click", () => startNewGame());
resetScoreButton.addEventListener("click", () => {
  scores[HUMAN] = 0;
  scores[COMPUTER] = 0;
  render();
  showToast("Match scores reset.");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    for (let offset = 1; offset <= COLUMNS; offset += 1) {
      const next = (selectedColumn + direction * offset + COLUMNS * 2) % COLUMNS;
      if (board[0][next] === 0) {
        selectedColumn = next;
        updateSelectedColumn();
        return;
      }
    }
  } else if (event.key === "Enter" && !event.target.matches("button")) {
    playColumn(selectedColumn);
  }
});

buildBoard();
