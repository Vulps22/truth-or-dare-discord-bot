// index.js
const games = [];

class Game {

    round = 1;
    currentIndex = 0;
    players = [];
    creator;
    guildId;


    createGame() {
        
        games.push(game);

        return game;
    }

    nextTurn(game) {
        game.currentIndex++;
        game.round++;

        if (game.currentIndex >= game.players.length) {
            game.currentIndex = 0;
        }

        return game;
    }
}

module.exports = {
    games,
    createGame,
    nextTurn
}