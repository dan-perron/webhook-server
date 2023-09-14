const YahooFantasy = require('yahoo-fantasy');

const config = require('config');

const tokenCallback = ({ access_token, refresh_token }) => {
  console.log('access_token: ' + access_token);
  console.log('refresh_token: ' + refresh_token);
  return Promise.resolve();
};

const yf = new YahooFantasy(
    config.get('yahoo.clientId'),
    config.get('yahoo.clientSecret'),
    tokenCallback, // optional
    'https://djperron.com/webhooks/yahoo/callback/' // optional
);

const auth = (res) => {
  yf.auth(res);
}

const authCallback = (req, cb) => {
  yf.authCallback(req, cb);
}

const getLeagueData = async () => {
  let data = await yf.leagues.fetch(
      [config.get('yahoo.leagueKey')],
      ['standings', 'teams', 'scoreboard']);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

module.exports = {auth, authCallback, getLeagueData};
