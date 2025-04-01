//########################################################################################
//########################################################################################

// Initialize games from localStorage or empty array
let games = JSON.parse(localStorage.getItem("chessGames")) || [];

function addGame(event) {
  showLoader();
  event.preventDefault();

  const result = document.getElementById("result").value;

  if (result === "0") {
    alert("Please select a result!");
    hideLoader();
    return;
  }

  const playerWhite = formatName(capitalize(document.getElementById("playerWhite").value));
  const playerBlack = formatName(capitalize(document.getElementById("playerBlack").value));

  const whiteRating = parseInt(document.getElementById("whiteRating").value) || 0;
  const blackRating = parseInt(document.getElementById("blackRating").value) || 0;

  const timeControl = document.getElementById("time").value || "";
  const time = `${timeControl} • ${getTimeControlCategory(timeControl)}`;

  const tournament = document.getElementById("tournament").value;
  const round = parseInt(document.getElementById("round").value) || 1;
  const date = document.getElementById("date").value;

  const game = {
    id: Date.now(),
    white: playerWhite,
    whiteRating: whiteRating, // This line should be present
    whiteTitle: abbreviateTitle(document.getElementById("whiteTitle").value.toUpperCase()),
    black: playerBlack,
    blackRating: blackRating, // This line should be present
    blackTitle: abbreviateTitle(document.getElementById("blackTitle").value.toUpperCase()),
    result: result,
    tournament: tournament,
    round: round,
    time: time,
    date: date,
    gameLink: document.getElementById("gameLink").value,
  };

  // 🚀 **Add duplicate check here BEFORE pushing to games**
  if (games.some(g => 
    g.white === playerWhite && 
    g.black === playerBlack && 
    g.date === date && 
    g.tournament === tournament && 
    g.round === round)) {
    hideLoader();
    alert("This game already exists!");
    return;
  }
    games.push(game);
    saveGames();
    displayGames();
    event.target.reset();
  
    hideLoader();
  
    alert(
      `${toUnicodeVariant(
        game.whiteTitle,
        "bold sans",
        "sans"
      )} ${playerWhite} vs ${toUnicodeVariant(
        game.blackTitle,
        "bold sans",
        "sans"
      )} ${playerBlack} Game Added!`
    );
}



document.getElementById("gameForm").addEventListener("submit", addGame);
document.getElementById("searchInput").addEventListener("input", (e) => {
  displayGames(e.target.value);
});

const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    tabContents[index].classList.add("active");
  });
});

displayGames();
