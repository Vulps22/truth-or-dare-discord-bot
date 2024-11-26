const RankCard = require('objects/rankCard'); // Adjust the path as necessary
const User = require('objects/user');

// Mock user object with necessary fields and methods
const user = {
    username: "TestUser",
    avatarURL: "testMode", // Placeholder URL
    truthsDone: 10,
    truthsFailed: 2,
    daresDone: 15,
    daresFailed: 3,
    globalXP: 0, // This will be updated in the loop
};
async function generateRankCards() {
    // Iterate through globalXP values from 1 to 200, step 10
    for (let xp = 220; xp <=230; xp+=1) {
        user.globalXP = xp; // Update the globalXP for this iteration

        let userClass = new User();
        userClass.username = user.username;
        userClass.globalXP = user.globalXP;
        userClass.truthsDone = user.truthsDone;
        userClass.truthsFailed = user.truthsFailed;
        userClass.daresDone = user.daresDone;
        userClass.daresFailed = user.daresFailed;

        // Instantiate the RankCard class with the updated user object
        const rankCard = new RankCard(userClass, userClass.username, user.avatarURL);

        // Generate the card
        let level = userClass.getLevel();
        let levelUpAt = userClass.calculateXpForLevel(level);
    };
}

generateRankCards();
