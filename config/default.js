const config = {
  mongodb: {
    connectionString: process.env.MONGODB_CONNSTRING,
  },
  slack: {
    appToken: null,
    signingSecret: null,
    token: null,
    webhookUrls: { civilization: null, test: null, ootp: null },
  },
};

module.exports = config;
