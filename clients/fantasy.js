const config = require('config');
const {transform} = require('node-json-transform');
const YahooFantasy = require('yahoo-fantasy');

const mongo = require('./mongo');

const tokenCallback = (tokens) => {
  console.log(JSON.stringify(tokens));
  return mongo.insertTokens(tokens);
};

const yf = new YahooFantasy(
    config.get('yahoo.clientId'),
    config.get('yahoo.clientSecret'),
    tokenCallback, // optional
    'https://djperron.com/webhooks/yahoo/callback/', // optional
);

mongo.getLatestTokens().then((tokens) => {
  if (tokens) {
    yf.setUserToken(tokens.access_token);
    yf.setRefreshToken(tokens.refresh_token);
  }
});

const auth = (res) => {
  yf.auth(res);
};

const authCallback = (req, cb) => {
  yf.authCallback(req, cb);
};

const leagueDataMap = {
  item: {
    name: 'name',
    num_teams: 'num_teams',
    scoring_type: 'head',
    current_week: 'current_week',
    start_date: 'start_date',
    end_date: 'end_date',
    game_code: 'game_code',
    season: 'season',
    standings: "standings",
    matchups: 'scoreboard.matchups',
  },
  operate: [
    {
      run: (standings) => transform(standings, standingsDataMap),
      on: 'standings',
    },
    {
      run: (matchups) => transform(matchups, matchupDataMap),
      on: 'matchups',
    },
  ],
};

const teamIdToSlackMap = {
  1: 'U6AT12XSM',
  2: 'U6KNBPYLE',
  3: 'U6BBM6R5Z',
  4: 'U6BHKHAUD',
  5: 'UC7GDQ4DU',
  6: 'U6DCHN9K2',
  7: 'U6CACS3GW',
  9: 'U6BEBDULB',
  10: 'U8K4LBSBZ',
  11: 'U6APYUG9E',
  12: 'U6B0178NM',
  14: 'U6BDMEER0',
};

const standingsDataMap = {
  item: {
    team_id: 'team_id',
    name: 'name',
    division_id: 'division_id',
    waiver_priority: 'waiver_priority',
    number_of_moves: 'number_of_moves',
    number_of_trades: 'number_of_trades',
    manager_name: 'managers.0.nickname',
    manager_tier: 'managers.0.felo_tier',
    standings: 'standings',
  },
  each: (item) => {
    item.slack_id = teamIdToSlackMap[item.team_id];
    return item;
  }
};

const matchupDataMap = {
  item: {
    week: 'week',
    week_start: 'week_start',
    week_end: 'week_end',
    teams: 'teams',
  },
  operate: [
    {
      run: (teams) => transform(teams, teamsDataMap),
      on: 'teams',
    },
  ],
};

const teamsDataMap = {
  item: {
    team_id: 'team_id',
    points: 'points',
    projected_points: 'projected_points',
  },
};

const getLeagueData = async () => {
  let rawData = await yf.leagues.fetch(
      [config.get('yahoo.leagueKey')],
      ['standings', 'scoreboard']);
  console.log(JSON.stringify(rawData, null, 2));
  let leagueData = transform(rawData.pop(), leagueDataMap);
  console.log(JSON.stringify(leagueData, null, 2));
  return leagueData;
};

module.exports = {auth, authCallback, getLeagueData};
