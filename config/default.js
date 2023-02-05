const config = {
  slack: {
    webhookUrls: { civilization: null, test: null },
  },
  mongodb: {
    connectionString: process.env.MONGODB_CONNSTRING,
  },
};

module.exports = config;
