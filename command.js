const TOKEN = process.env['TOKEN']
const CLIENT_ID = process.env['CLIENT_ID']
const GUILD_ID = process.env['GUILD_ID']

const modCommands = [
  {
    name: "update-commands",
    description: "You cannot read this description and you are not in the Truth Or Dare Online 18+ development server."
  },
  {
    name: 'register',
    description: 'Only required if you want to create a new Truth or Dare'
  },
  {
    name: 'reportdare',
    description: 'Report a Dare that might be dangerous or illegal.'
  },
  {
    name: 'reporttruth',
    description: 'Report a Truth that might be dangerous or illegal.'
  },
  {
    name: "reportguild",
    description: 'Report a Guild that allows anybody under 18 to use this bot, or uses this bot to break discord ToS'
  }
]

const globalCommands = [
  {
    name: 'truth',
    description: 'Get a Truth question. Remember, you **must** answer honestly!',
    nsfw: true
  },
  {
    name: 'dare',
    description: 'Get a Dare. Remember to prove you did it ;)',
    nsfw: true
  },
  {
    name: 'createdare',
    nsfw: true,
    description: 'Create a Dare for others. Remember to keep it safe &legal',
    type: 1,
    options: [{
      name: "text",
      type: 3,
      description: "What would you like your dare to say? Remember to keep it legal and safe"
    }]
  },
  {
    name: 'createtruth',
    nsfw: true,
    description: 'Create a Truth for others. Remember to keep it safe & legal',
    type: 1,
    options: [{
      name: "text",
      type: 3,
      description: "What would you like your dare to say? Remember to keep it legal and safe"
    }]
  },
  {
    name: 'random',
    nsfw: true,
    description: 'Get a random truth or dare, let the bot decide!',
  },
  {
    name: 'accept-terms',
    description: 'Required by ALL Servers before users can use any commands'
  },
  {
    name: 'setup',
    description: 'Required by ALL Servers before users can use any commands'
  },
  {
    name: 'givedare',
    nsfw: true,
    description: 'Dares a user to do something',
    options: [
      {
        name: 'user',
        type: 6,
        description: 'The user to give the dare to',
        required: true,
      },
      {
        name: 'dare',
        type: 3,
        description: 'The dare to give',
        required: true,
      },
    ],
  }
];


module.exports = {
  modCommands,
  globalCommands
};