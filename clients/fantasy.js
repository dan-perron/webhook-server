import config from 'config';
import {transform} from 'node-json-transform';
import YahooFantasy from 'yahoo-fantasy';

import * as mongo from './mongo.js';

const leagueKey = config.get('yahoo.leagueKey');

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

export function auth(res) {
  yf.auth(res);
}

export function authCallback(req, cb) {
  yf.authCallback(req, cb);
}

const leagueDataMap = {
  item: {
    name: 'name',
    num_teams: 'num_teams',
    current_week: 'current_week',
    teams: 'standings',
  },
  operate: [
    {
      run: (teams) => transform(teams, teamDataMap),
      on: 'teams',
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

const teamDataMap = {
  item: {
    team_id: 'team_id',
    name: 'name',
    moves: 'number_of_moves',
    trades: 'number_of_trades',
    manager_name: 'managers.0.nickname',
    standings: {
      rank: 'standings.rank',
      outcome: {wins: 'standings.outcome_totals.wins', losses: 'standings.outcome_totals.losses'},
      streak: 'standings.streak',
      points_for: 'standings.points_for',
      points_against: 'standings.points_against',
    },
  },
  each: (item) => {
    item.slack_id = teamIdToSlackMap[item.team_id];
    item.standings.streak = `${item.standings.streak.value} ${item.standings.streak.type}`;
    return item;
  },
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
    points: 'points.total',
    projected_points: 'projected_points.total',
  },
};

const rosterDataMap = {
  item: {
    name: 'name.full',
    position: 'primary_position',
  },
};

export async function getLeagueData() {
  let rawData = await yf.leagues.fetch(
      [leagueKey],
      ['standings', 'scoreboard']);
  let leagueData = transform(rawData.pop(), leagueDataMap);
  // const week = rawData.current_week;
  for (let team of leagueData.teams) {
    let teamKey = leagueKey + '.t.' + team.team_id;
    let [rawRosterData, rawMatchupData] = await Promise.all([yf.roster.players(teamKey), yf.team.matchups(teamKey)]);
    let roster = transform(rawRosterData.roster, rosterDataMap);
    // let matchups = transform(rawMatchupData.matchups, matchupDataMap);
    // let matchupString = '';
    // for (let matchup of matchups) {
    //   let primaryTeam = matchup.teams.find((t) => t.team_id === team.team_id);
    //   let otherTeam = matchup.teams.find((t) => t.team_id !== team.team_id);
    //   if (Date.parse(matchup.week_end) < Date.now()) {
    //     matchupString += `On week ${matchup.week} ${team.team_id} played ${otherTeam.team_id}: ${primaryTeam.points >
    //     otherTeam.points ?
    //         'won' :
    //         'lost'} ${primaryTeam.points} to ${otherTeam.points}, they were expected to ${primaryTeam.projected_points >
    //     otherTeam.projected_points ? 'win' : 'lose'} ${primaryTeam.projected_points} to ${otherTeam.projected_points}. `;
    //   } else if (Date.parse(matchup.week_start) < Date.now()) {
    //     matchupString += `In the current week (${matchup.week}) ${team.team_id} is playing ${otherTeam.team_id}: So far is ${primaryTeam.points >
    //     otherTeam.points ?
    //         'winning' :
    //         'losing'} ${primaryTeam.points} to ${otherTeam.points}, they were expected to ${primaryTeam.projected_points >
    //     otherTeam.projected_points ? 'win' : 'lose'} ${primaryTeam.projected_points} to ${otherTeam.projected_points}.`;
    //   } else {
    //     matchupString += `In week ${matchup.week} ${team.team_id} will play ${otherTeam.team_id}: They are expected to ${primaryTeam.projected_points >
    //     otherTeam.projected_points ? 'win' : 'lose'} ${primaryTeam.projected_points} to ${otherTeam.projected_points}.`;
    //   }
    // }
    // team.matchups = matchupString;
    team.roster = roster.map((p) => p.position + ': ' + p.name).join(', ');
  }
  // for (let matchup of rawData.matchups) {
  //   for (let team of matchup.teams) {
  //   }
  // }
  console.log(JSON.stringify(leagueData, null, 2));
  return leagueData;
}
