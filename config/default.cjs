const config = {
  ai: {
    client: 'google',
  },
  aws: {
    accessKey: '',
    secretAccessKey: '',
    region: 'us-east-2',
    bucket: '',
  },
  googleai: {
    key: null,
  },
  mongodb: {
    connectionString: process.env.MONGODB_CONNSTRING,
  },
  openai: {
    key: null,
    useComplete: false,
    returnImages: false,
    model: 'gpt-4-1106-preview',
  },
  slack: {
    appToken: null,
    signingSecret: null,
    token: null,
    webhookUrls: { civilization: null, test: null, ootp: null },
  },
  yahoo: {
    appId: null,
    clientId: null,
    clientSecret: null,
    leagueKey: null,
  },
};
module.exports = config;
