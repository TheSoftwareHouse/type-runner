const Game = require('./game');
const { NORMAL, PRACTICE } = require('./game-types');

const GAME_REMOVE_TIME = 4 * 60 * 1000;

class Games {
  constructor(highScoreRepository) {
    this.openGames = {};
    this.runningGames = {};
    this.practiceGames = {};
    this.spectators = [];
    this.highscores = highScoreRepository;
  }

  newGame() {
    const game = new Game(NORMAL);

    this.openGames[game.getId()] = game;

    return game;
  }

  newPractice() {
    const game = new Game(PRACTICE);
    this.practiceGames[game.getId()] = game;
    return game;
  }

  run(game) {
    const id = game.getId();
    const type = game.getType();

    switch (type) {
      case NORMAL:
        this.runningGames[id] = this.openGames[id];
        delete this.openGames[id];
        break;
      case PRACTICE:
        this.runningGames[id] = this.practiceGames[id];
        delete this.practiceGames[id];
        break;
      default:
        throw new Error('Invalid game type')
    }

    this.runningGames[id].startGameTime();
    this.limitGameLength(id);
  }

  addSpectator(spectatorId) {
    this.spectators.push(spectatorId);
  }

  limitGameLength(gameId) {
    setTimeout(() => {
      if (this.runningGames[gameId]) {
        delete this.runningGames[gameId];
      }
    }, GAME_REMOVE_TIME);
  }

  finishGame(id) {
    this.runningGames[id].removeAllListeners();
    delete this.runningGames[id];
  }

  findOpenGame() {
    const availableGames = Object.values(this.openGames);
    return availableGames.find(game => game.openForPlayers());
  }

  removePlayerFromOpenGames(playerId) {
    const removedPlayers = [];

    Object.values(this.openGames).forEach(game => {
      if (game.hasPlayer(playerId)) {
        game.removePlayer(playerId);

        removedPlayers.push({
          gameId: game.getId(),
          playerId
        });
      }
    });

    return removedPlayers;
  }

  getOpenGameById(gameId) {
    return this.openGames[gameId];
  }

  getGameById(gameId) {
    return this.runningGames[gameId];
  }

  addScore(name, score) {
    this.highscores.addHighScore(name, score);
  }

  async getHighscores() {
    const highScores = await this.highscores.getHighScores();
    return highScores || [];
  }
}

module.exports = Games;
