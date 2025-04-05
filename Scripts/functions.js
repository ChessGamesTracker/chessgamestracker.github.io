function toUnicodeVariant(str, variant, flags) {
  const offsets = {
    m: [0x1d670, 0x1d7f6],
    b: [0x1d400, 0x1d7ce],
    i: [0x1d434, 0x00030],
    bi: [0x1d468, 0x00030],
    c: [0x1d49c, 0x00030],
    bc: [0x1d4d0, 0x00030],
    g: [0x1d504, 0x00030],
    d: [0x1d538, 0x1d7d8],
    bg: [0x1d56c, 0x00030],
    s: [0x1d5a0, 0x1d7e2],
    bs: [0x1d5d4, 0x1d7ec],
    is: [0x1d608, 0x00030],
    bis: [0x1d63c, 0x00030],
    o: [0x24b6, 0x2460],
    p: [0x249c, 0x2474],
    w: [0xff21, 0xff10],
    u: [0x2090, 0xff10],
  };

  const variantOffsets = {
    monospace: "m",
    bold: "b",
    italic: "i",
    "bold italic": "bi",
    script: "c",
    "bold script": "bc",
    gothic: "g",
    "gothic bold": "bg",
    doublestruck: "d",
    sans: "s",
    "bold sans": "bs",
    "italic sans": "is",
    "bold italic sans": "bis",
    parenthesis: "p",
    circled: "o",
    fullwidth: "w",
  };

  // special characters (absolute values)
  var special = {
    m: {
      " ": 0x2000,
      "-": 0x2013,
    },
    i: {
      h: 0x210e,
    },
    g: {
      C: 0x212d,
      H: 0x210c,
      I: 0x2111,
      R: 0x211c,
      Z: 0x2128,
    },
    o: {
      0: 0x24ea,
      1: 0x2460,
      2: 0x2461,
      3: 0x2462,
      4: 0x2463,
      5: 0x2464,
      6: 0x2465,
      7: 0x2466,
      8: 0x2467,
      9: 0x2468,
    },
    p: {},
    w: {},
  };
  //support for parenthesized latin letters small cases
  for (var i = 97; i <= 122; i++) {
    special.p[String.fromCharCode(i)] = 0x249c + (i - 97);
  }
  //support for full width latin letters small cases
  for (var i = 97; i <= 122; i++) {
    special.w[String.fromCharCode(i)] = 0xff41 + (i - 97);
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  var getType = function (variant) {
    if (variantOffsets[variant]) return variantOffsets[variant];
    if (offsets[variant]) return variant;
    return "m"; //monospace as default
  };
  var getFlag = function (flag, flags) {
    if (!flags) return false;
    return flags.split(",").indexOf(flag) > -1;
  };

  var type = getType(variant);
  var underline = getFlag("underline", flags);
  var strike = getFlag("strike", flags);
  var result = "";

  for (var k of str) {
    let index;
    let c = k;
    if (special[type] && special[type][c])
      c = String.fromCodePoint(special[type][c]);
    if (type && (index = chars.indexOf(c)) > -1) {
      result += String.fromCodePoint(index + offsets[type][0]);
    } else if (type && (index = numbers.indexOf(c)) > -1) {
      result += String.fromCodePoint(index + offsets[type][1]);
    } else {
      result += c;
    }
    if (underline) result += "\u0332"; // add combining underline
    if (strike) result += "\u0336"; // add combining strike
  }
  return result;
}
//###################################################//
//###################################################//

function saveGames() {
  localStorage.setItem("chessGames", JSON.stringify(games));
}

function generateUniqueID() {
  return crypto.randomUUID();
}

function capitalize(str) {
  let capitalizedStr = "";
  let words = str.split(" ");
  for (let i = 0; i < words.length; i++) {
    let word = words[i].toLowerCase();
    capitalizedStr += word.charAt(0).toUpperCase() + word.slice(1) + " ";
  }
  return capitalizedStr.trim();
}

function refreshTitle() {
  document.querySelectorAll(".title").forEach(function (titleElement) {
    const content = titleElement.textContent.trim().toLowerCase();
    if (!content || content === "none") {
      titleElement.style.display = "none";
    } else {
      titleElement.style.display = ""; // Reset to default if content is valid
    }
  });
}


function getTimeControlCategory(timeControl) {
  // Normalize input to handle various formats
  const parseTimeControl = (tc) => {
    const cleanTC = String(tc).toLowerCase().replace(/\s+/g, "");

    let initialTime, increment;

    // Split time and increment
    if (cleanTC.includes("+")) {
      [initialTime, increment] = cleanTC.split("+").map(Number);
    } else if (cleanTC.includes("|")) {
      [initialTime, increment] = cleanTC.split("|").map(Number);
    } else if (cleanTC.includes("min")) {
      initialTime = Number(cleanTC.replace("min", ""));
      increment = 0;
    } else {
      initialTime = Number(cleanTC);
      increment = 0;
    }

    return { initialTime, increment };
  };

  // Classify time control based on initial time and increment
  const classifyTimeControl = (initial, increment) => {
    // Convert everything to seconds for easier calculation
    const initialSeconds = initial * 60;
    const incrementSeconds = increment;
    
    // Estimated total time in seconds for a 40-move game
    const estimatedSeconds = initialSeconds + (incrementSeconds * 40);
    
    // Convert back to minutes for classification
    const estimatedMinutes = estimatedSeconds / 60;
    
    // Bullet: Games expected to last less than 3 minutes
    if (initial < 3 && estimatedMinutes < 7) {
      return "Bullet";
    }
    
    // Blitz: Games expected to last less than 10 minutes
    if (initial < 10 && estimatedMinutes < 25) {
      return "Blitz";
    }

    // Rapid: Games expected to last less than 60 minutes
    if (initial < 30 && estimatedMinutes < 60) {
      return "Rapid";
    }

    // Classical: Games expected to last 60 minutes or more
    return "Classical";
  };

  try {
    const { initialTime, increment } = parseTimeControl(timeControl);
    return classifyTimeControl(initialTime, increment);
  } catch (error) {
    return "Unknown";
  }
}

/* AUTOCOMPLETE FUNCTIONS */
async function fetchPlayerNames(query) {
  // Setup abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    // Construct and encode the API URL
    const apiUrl = `https://lichess.org/api/fide/player?q=${encodeURIComponent(query.trim())}`;
    const response = await fetch(apiUrl, { signal: controller.signal });

    // Handle unsuccessful responses
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();
    clearTimeout(timeoutId); // Prevent timeout from firing after completion

    // Return only name and title data
    return data.map(player => ({
      name: formatName(player.name),
      title: abbreviateTitle(player.title)
    }));
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    // Log the error
    console.error('Error fetching player names:', error);
    
    // Return an empty array on failure
    return [];
  }
}

function highlightMatch(text, query) {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<span style="font-weight: 700;">$1</span>');
}

function showSuggestions(titleElement, inputElement, suggestionsContainer, suggestions) {
  const query = inputElement.value.trim();
  suggestionsContainer.innerHTML = '';
  suggestions.forEach(player => {
    const suggestionItem = document.createElement('div');
    suggestionItem.classList.add('autocomplete-suggestion');
    const highlightedName = highlightMatch(player.name, query);
    const displayText = player.title 
      ? `<span class="title">${player.title}</span> ${highlightedName}`
      : highlightedName;
    suggestionItem.innerHTML = displayText;
    suggestionItem.dataset.name = player.name;
    suggestionItem.dataset.title = player.title || '';
    suggestionsContainer.appendChild(suggestionItem);
  });
}

document.getElementById('playerWhite').addEventListener('input', async function (e) {
  const query = e.target.value;
  const whiteTitleElement = document.getElementById('whiteTitle');
  const suggestionsContainer = document.getElementById('whiteSuggestions');
  if (query.length > 1) {
    const suggestions = await fetchPlayerNames(query);
    showSuggestions(whiteTitleElement, e.target, suggestionsContainer, suggestions);
  } else {
    suggestionsContainer.innerHTML = '';
    e.target.dataset.title = '';
  }
});

document.getElementById('playerBlack').addEventListener('input', async function (e) {
  const query = e.target.value;
  const blackTitleElement = document.getElementById('blackTitle');
  const suggestionsContainer = document.getElementById('blackSuggestions');
  if (query.length > 1) {
    const suggestions = await fetchPlayerNames(query);
    showSuggestions(blackTitleElement, e.target, suggestionsContainer, suggestions);
  } else {
    suggestionsContainer.innerHTML = '';
    e.target.dataset.title = '';
  }
});

// Add event delegation for suggestion clicks
document.getElementById('whiteSuggestions').addEventListener('click', function(e) {
  const suggestionItem = e.target.closest('.autocomplete-suggestion');
  if (suggestionItem) {
    const playerInput = document.getElementById('playerWhite');
    const titleElement = document.getElementById('whiteTitle');
    playerInput.value = suggestionItem.dataset.name;
    titleElement.value = suggestionItem.dataset.title;
    playerInput.dataset.title = suggestionItem.dataset.title;
    this.innerHTML = '';
  }
});

document.getElementById('blackSuggestions').addEventListener('click', function(e) {
  const suggestionItem = e.target.closest('.autocomplete-suggestion');
  if (suggestionItem) {
    const playerInput = document.getElementById('playerBlack');
    const titleElement = document.getElementById('blackTitle');
    playerInput.value = suggestionItem.dataset.name;
    titleElement.value = suggestionItem.dataset.title;
    playerInput.dataset.title = suggestionItem.dataset.title;
    this.innerHTML = '';
  }
});

// Add Escape key functionality to close suggestions
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.getElementById('whiteSuggestions').innerHTML = '';
    document.getElementById('blackSuggestions').innerHTML = '';
  }
});

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
  const whiteSuggestions = document.getElementById('whiteSuggestions');
  const blackSuggestions = document.getElementById('blackSuggestions');
  const playerWhite = document.getElementById('playerWhite');
  const playerBlack = document.getElementById('playerBlack');
  
  if (!playerWhite.contains(e.target) && !whiteSuggestions.contains(e.target)) {
    whiteSuggestions.innerHTML = '';
  }
  
  if (!playerBlack.contains(e.target) && !blackSuggestions.contains(e.target)) {
    blackSuggestions.innerHTML = '';
  }
});

/*LOADER FUNCTIONS*/
function showLoader() {
  document.getElementById("loader").style.display = "inline";
  document.querySelector("#addGame span").innerHTML = "Loading";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
  document.querySelector("#addGame span").innerHTML = "Add Game";
}

function abbreviateTitle(title) {
  if (!title) return ""; // Ensure empty input doesn't cause errors

  const titleMap = {
    grandmaster: "GM",
    internationalmaster: "IM",
    fidemaster: "FM",
    candidatemaster: "CM",
    womangrandmaster: "WGM",
    womaninternationalmaster: "WIM",
    womanfidemaster: "WFM",
    womancandidatemaster: "WCM",
    nationalmaster: "NM",
  };

  return titleMap[title.toLowerCase().replace(/\s+/g, "")] || title;
}

function formatName(name) {
  let parts = name.split(", ").map(part => part.trim());
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}

function isEmpty(array) {
  return !array || array.length === 0;
}

function exportJSON() {
  if (isEmpty(games)) {
    alert("No games were found in this database");
    return;
  }

  // Convert the games array to a JSON string
  const dataInitial = JSON.parse(JSON.stringify(games));

  // Remove the "id" key from each game object
  dataInitial.forEach(game => {
    delete game.id;
  });

  // Convert the modified array to a JSON string
  const data = JSON.stringify(dataInitial, null, 2);

  // Create a Blob from the JSON string
  const blob = new Blob([data], { type: "application/json" });

  // Create a link element
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ChessGamesBackup.json`;

  // Trigger the download
  link.click();

  // Clean up
  URL.revokeObjectURL(link.href);
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
      try {
          const importedData = JSON.parse(e.target.result);
          
          // Generate new IDs for each imported game
          importedData.forEach(game => {
            game.id = generateUniqueID();
          });
          
          if (!Array.isArray(importedData)) {
              alert("Invalid file format! Make sure you're uploading a valid JSON backup.");
              return;
          } else if (isEmpty(importedData)) {
            alert("No games were found in this database");
            return;
          }

          // Update the games variable
          games = importedData;
          localStorage.setItem("chessGames", JSON.stringify(games));
          displayGames(); // Refresh the displayed games

          alert("Games imported successfully!");
      } catch (error) {
          alert("Error parsing JSON file!");
          console.error(error);
      }
  };

  reader.readAsText(file);
}


function deleteGame(id) {
  let gameToDelete = games.find((game) => game.id === id);
  let delete_confirmation = `Are you sure you want to delete:\n ${toUnicodeVariant(
    gameToDelete.whiteTitle,
    "bold sans",
    "sans"
  )} ${gameToDelete.white} vs ${toUnicodeVariant(
    gameToDelete.blackTitle,
    "bold sans",
    "sans"
  )} ${gameToDelete.black} ?`;
  if (confirm(delete_confirmation) == true) {
    games = games.filter((game) => game.id !== id);
    saveGames();
    displayGames();
  }
}

function displayGames(searchTerm = "") {
  const gamesList = document.getElementById("gamesList");
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredGames = games
    .filter(
      (game) =>
        game.white.toLowerCase().includes(normalizedSearchTerm) ||
        game.black.toLowerCase().includes(normalizedSearchTerm) ||
        game.tournament.toLowerCase().includes(normalizedSearchTerm)
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group games by tournament
  const gamesByTournament = filteredGames.reduce((acc, game) => {
    if (!acc[game.tournament]) {
      acc[game.tournament] = [];
    }
    acc[game.tournament].push(game);
    return acc;
  }, {});

  // Generate HTML with tournament headers
  gamesList.innerHTML = Object.entries(gamesByTournament)
    .map(([tournament, tournamentGames]) => `
      <div class="tournament-section">
        <div class="tournament-header">
          <h3>${tournament}</h3>
          <h3 class="dot">●</h3>
        </div>
        ${tournamentGames
          .map(
            (game) => `
              <a href="${game.gameLink}" target="_blank" class="game-entry-link">
                <div class="game-entry" data-game-id="${game.id}">
                    <div class="game-details" style="align-items: center;">
                        <div class="game-tournament"><span class="game-round">${game.round}</span><strong>${game.tournament}</strong></div>
                        <span class="entry-date"><span class="game-time">${game.time} • ${getTimeControlCategory(game.time)}</span> | <strong>${game.date}</strong></span>
                    </div>
                    <div class="player-details">
                      <div class="player-left">
                            <span>
                                <span class="title">${game.whiteTitle}</span> ${game.white} <span class="player-rating">${game.whiteRating}</span>
                            </span>
                      </div>
                      <div class="game-result">
                        <strong>${game.result}</strong>
                      </div>
                      <div class="player-right">
                        <span>
                          <span class="title">${game.blackTitle}</span> ${game.black} <span class="player-rating">${game.blackRating}</span>
                        </span>
                      </div>
                    </div>
                    <button class="delete-game-btn" onclick="deleteGame('${game.id}'); event.preventDefault()"><i class="fa-solid fa-delete-left"></i></button>
                </div>
              </a>
            `
          )
          .join("")}
      </div>
    `)
    .join("");

  refreshTitle();
}