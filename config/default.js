const config = {
  slack: {
    webhookUrls: { civilization: null, test: null, ootp: null },
  },
  mongodb: {
    connectionString: process.env.MONGODB_CONNSTRING,
  },
};

module.exports = config;
