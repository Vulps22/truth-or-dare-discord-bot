const Leaderboard = require('objects/leaderboard.js');

async function testPlayers(){
const leaderboard = new Leaderboard({}, {});

const players = await leaderboard.fetchTopPlayers()

console.log(players);
}

testPlayers();