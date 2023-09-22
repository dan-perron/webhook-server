const {transform} = require('node-json-transform');
const util = require('util');

const data = {
  'league_key': '423.l.248982',
  'league_id': '248982',
  'name': 'Slowly Expanding Cheeseburger',
  'url': 'https://football.fantasysports.yahoo.com/f1/248982',
  'logo_url': false,
  'password': '',
  'draft_status': 'postdraft',
  'num_teams': 14,
  'edit_key': '2',
  'weekly_deadline': '',
  'league_update_timestamp': '1694673732',
  'scoring_type': 'head',
  'league_type': 'private',
  'renew': '414_810439',
  'renewed': '',
  'felo_tier': 'gold',
  'iris_group_chat_id': '',
  'short_invitation_url': 'https://football.fantasysports.yahoo.com/f1/248982/invitation?key=877cda58b0d9d768&ikey=c327d17e88f843b1',
  'allow_add_to_dl_extra_pos': 0,
  'is_pro_league': '0',
  'is_cash_league': '0',
  'current_week': 2,
  'start_week': '1',
  'start_date': '2023-09-07',
  'end_week': '17',
  'end_date': '2024-01-02',
  'is_plus_league': '0',
  'game_code': 'nfl',
  'season': '2023',
  'standings': [
    {
      'team_key': '423.l.248982.t.5',
      'team_id': '5',
      'name': 'Putin the Butt',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/5',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/59597645812_36fee0.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 10,
      'number_of_moves': 1,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '5',
          'nickname': 'Erik',
          'guid': '2PHPERRYQTXRW5DMBJR2AL7G5I',
          'image_url': 'https://s.yimg.com/ag/images/4730/38419588835_f5a842_64sq.jpg',
          'felo_score': '843',
          'felo_tier': 'platinum',
        }],
      'standings': {
        'rank': '1', 'playoff_seed': '1', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '92.95', 'points_against': 52.18,
      },
    }, {
      'team_key': '423.l.248982.t.7',
      'team_id': '7',
      'name': 'Lemon Herbert Party',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/7',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/25202764631_8bc646a704.jpg',
        }],
      'division_id': '2',
      'waiver_priority': 8,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 191,
      'managers': [
        {
          'manager_id': '7',
          'nickname': 'Flaherty',
          'guid': 'RPDXRRSINEITQUPUOVRP5OR7TM',
          'is_commissioner': '1',
          'image_url': 'https://s.yimg.com/ag/images/4536/37425292353_d7d441_64sq.jpg',
          'felo_score': '759',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '2', 'playoff_seed': '2', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '91.38', 'points_against': 53.82,
      },
    }, {
      'team_key': '423.l.248982.t.4',
      'team_id': '4',
      'name': 'Brown-Tainted Love',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/4',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/0ea6b46372b6b84eda1644b4d66ea9a257bd4e9758f7a267b3cae38be96dc00d.png',
        }],
      'division_id': '2',
      'waiver_priority': 6,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '4',
          'nickname': 'Justin',
          'guid': 'MYOPLHY3JKSC2AIMZV4RFZDM64',
          'image_url': 'https://s.yimg.com/ag/images/default_user_profile_pic_64sq.jpg',
          'felo_score': '744',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '3', 'playoff_seed': '3', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '86.42', 'points_against': 59.42,
      },
    }, {
      'team_key': '423.l.248982.t.13',
      'team_id': '13',
      'name': 'Kirko Drippin',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/13',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/b582b9972bee802197826e53d5cf77a753c9529026f24f58e61f289eebdd057f.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 7,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '13',
          'nickname': 'Keith Veldkamp',
          'guid': 'XBH54RNLU27TDXGT46AUJIPTKA',
          'image_url': 'https://s.yimg.com/ag/images/4586/37940255370_23ba0d_64sq.jpg',
          'felo_score': '571',
          'felo_tier': 'bronze',
        }],
      'standings': {
        'rank': '4', 'playoff_seed': '4', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '85.58', 'points_against': 67.53,
      },
    }, {
      'team_key': '423.l.248982.t.12',
      'team_id': '12',
      'name': 'Bris time for your Ju Chubb',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/12',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/1caacd8d59a286e9515cea28dfde2437ce74db5703805ee910fde8aff9be4e7d.jpg',
        }],
      'division_id': '2',
      'waiver_priority': 12,
      'number_of_moves': 3,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '12',
          'nickname': 'Peter',
          'guid': 'DBOVW7DZZPK2UT5DG25UXENEME',
          'image_url': 'https://s.yimg.com/ag/images/4593/38273803285_a8f7b7_64sq.jpg',
          'felo_score': '581',
          'felo_tier': 'bronze',
        }],
      'standings': {
        'rank': '5', 'playoff_seed': '5', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '84.63', 'points_against': 55.08,
      },
    }, {
      'team_key': '423.l.248982.t.9',
      'team_id': '9',
      'name': 'Long Arm of T-Law',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/9',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/0a96a2ef02baf9d0bf8508a9e581d98a265f4458c682fabe148665b2d15d7f3d.png',
        }],
      'division_id': '1',
      'waiver_priority': 9,
      'number_of_moves': 1,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '9',
          'nickname': 'Carbunkle',
          'guid': 'QJFJEIAIR3SIG7QUZ65MCQER6Y',
          'image_url': 'https://s.yimg.com/ag/images/4735/24358305827_5c9865_64sq.jpg',
          'felo_score': '875',
          'felo_tier': 'platinum',
        }],
      'standings': {
        'rank': '6', 'playoff_seed': '6', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '84.08', 'points_against': 68.68,
      },
    }, {
      'team_key': '423.l.248982.t.8',
      'team_id': '8',
      'name': 'Just the (M)ete',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/8',
      'team_logos': [
        {
          'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_4_m.png',
        }],
      'division_id': '1',
      'waiver_priority': 2,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 199,
      'managers': [
        {
          'manager_id': '8',
          'nickname': 'Marki',
          'guid': '65VEFNBDYF6Q2IDN4TB6HEBRPA',
          'image_url': 'https://s.yimg.com/ag/images/default_user_profile_pic_64sq.jpg',
          'felo_score': '721',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '7', 'playoff_seed': '7', 'outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0, 'percentage': '1.000',
        }, 'divisional_outcome_totals': {
          'wins': '1', 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'win', 'value': '1',
        }, 'points_for': '67.73', 'points_against': 63.78,
      },
    }, {
      'team_key': '423.l.248982.t.10',
      'team_id': '10',
      'name': 'Purdy Mouth Pluggers',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/10',
      'team_logos': [
        {
          'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_4_a.png',
        }],
      'division_id': '2',
      'waiver_priority': 5,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 169,
      'managers': [
        {
          'manager_id': '10',
          'nickname': 'Andre',
          'guid': 'KKMORW344KO24ODLLE4MHYZHK4',
          'image_url': 'https://s.yimg.com/ag/images/4590/37623125843_ee8875_64sq.jpg',
          'felo_score': '589',
          'felo_tier': 'bronze',
        }],
      'standings': {
        'rank': '8', 'playoff_seed': '8', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': 0, 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '68.68', 'points_against': 84.08,
      },
    }, {
      'team_key': '423.l.248982.t.11',
      'team_id': '11',
      'name': 'Four and Out',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/11',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/39a5a1706d2673b164cf7e39d0df5afbf500fa179856d0a7b80536407bea8404.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 1,
      'number_of_moves': 2,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '2',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '11',
          'nickname': 'Joe',
          'guid': 'MFU6FR7LE2RJVSZQJ2TKNP2AVI',
          'image_url': 'https://s.yimg.com/ag/images/4551/37880323470_28947c_64sq.jpg',
          'felo_score': '590',
          'felo_tier': 'bronze',
        }],
      'standings': {
        'rank': '9', 'playoff_seed': '9', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '67.53', 'points_against': 85.58,
      },
    }, {
      'team_key': '423.l.248982.t.1',
      'team_id': '1',
      'name': 'Definitely Did A Murder',
      'is_owned_by_current_login': 1,
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/1',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/e05ef8b4aad08abe5c530d0d1c4f8d2c9004ffbd6debef69bf90876dccbac6a7.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 3,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '1',
          'nickname': 'Dan Perron',
          'guid': 'YV6IA52VPAIR3LUBAROLMDQJ2E',
          'is_commissioner': '1',
          'is_current_login': '1',
          'image_url': 'https://s.yimg.com/ag/images/4538/38397836431_6ec8df_64sq.jpg',
          'felo_score': '728',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '10', 'playoff_seed': '10', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '63.78', 'points_against': 67.73,
      },
    }, {
      'team_key': '423.l.248982.t.6',
      'team_id': '6',
      'name': 'Let Love Into Your Heart',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/6',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/3036b69ee5cb0633f9089f9ffdab715e7113e084a56e7be6bf230e89e32e125f.png',
        }],
      'division_id': '2',
      'waiver_priority': 4,
      'number_of_moves': 1,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '6',
          'nickname': 'Jacob',
          'guid': '4BV7VSGHH63EGFKNKPXDUB36WY',
          'image_url': 'https://s.yimg.com/ag/images/4567/37727909760_5d00dc_64sq.jpg',
          'felo_score': '586',
          'felo_tier': 'bronze',
        }],
      'standings': {
        'rank': '11', 'playoff_seed': '11', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '59.42', 'points_against': 86.42,
      },
    }, {
      'team_key': '423.l.248982.t.2',
      'team_id': '2',
      'name': 'Miles & Miles of Hard On',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/2',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/3db4f46bfdd5af0eaffa34063db3a43afd8f40236251b59851a03c771328cc37.jpg',
        }],
      'division_id': '2',
      'waiver_priority': 11,
      'number_of_moves': 2,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '2',
          'nickname': 'Stark',
          'guid': 'J2IEURO2ZD4G73OVMZMPPMKIXM',
          'image_url': 'https://s.yimg.com/ag/images/4561/37885834270_5a379f_64sq.jpg',
          'felo_score': '730',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '12', 'playoff_seed': '12', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '55.08', 'points_against': 84.63,
      },
    }, {
      'team_key': '423.l.248982.t.14',
      'team_id': '14',
      'name': 'Show me yo T-wat-Son',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/14',
      'team_logos': [
        {
          'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_2_n.png',
        }],
      'division_id': '2',
      'waiver_priority': 14,
      'number_of_moves': 6,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '4',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '14',
          'nickname': 'Nicolo',
          'guid': 'GV5YGXDODZCIPK2XSCBTPEDOMU',
          'image_url': 'https://s.yimg.com/ag/images/4735/39028432546_db479e_64sq.jpg',
          'felo_score': '708',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '13', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '53.82', 'points_against': 91.38,
      },
    }, {
      'team_key': '423.l.248982.t.3',
      'team_id': '3',
      'name': 'The Gutekunspirators',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/3',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/25299390185_0122c905c7.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 13,
      'number_of_moves': 2,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '3',
          'nickname': 'Ryan',
          'guid': 'M4VCDPWFETWPXCD6MGILBO5ZKE',
          'image_url': 'https://s.yimg.com/ag/images/4689/38448487774_95adad_64sq.jpg',
          'felo_score': '794',
          'felo_tier': 'gold',
        }],
      'standings': {
        'rank': '14', 'outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0, 'percentage': '.000',
        }, 'divisional_outcome_totals': {
          'wins': 0, 'losses': '1', 'ties': 0,
        }, 'streak': {
          'type': 'loss', 'value': '1',
        }, 'points_for': '52.18', 'points_against': 92.95,
      },
    }],
  'teams': [
    {
      'team_key': '423.l.248982.t.1',
      'team_id': '1',
      'name': 'Definitely Did A Murder',
      'is_owned_by_current_login': 1,
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/1',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/e05ef8b4aad08abe5c530d0d1c4f8d2c9004ffbd6debef69bf90876dccbac6a7.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 3,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '1',
          'nickname': 'Dan Perron',
          'guid': 'YV6IA52VPAIR3LUBAROLMDQJ2E',
          'is_commissioner': '1',
          'is_current_login': '1',
          'image_url': 'https://s.yimg.com/ag/images/4538/38397836431_6ec8df_64sq.jpg',
          'felo_score': '728',
          'felo_tier': 'gold',
        }],
    }, {
      'team_key': '423.l.248982.t.2',
      'team_id': '2',
      'name': 'Miles & Miles of Hard On',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/2',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/3db4f46bfdd5af0eaffa34063db3a43afd8f40236251b59851a03c771328cc37.jpg',
        }],
      'division_id': '2',
      'waiver_priority': 11,
      'number_of_moves': 2,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '2',
          'nickname': 'Stark',
          'guid': 'J2IEURO2ZD4G73OVMZMPPMKIXM',
          'image_url': 'https://s.yimg.com/ag/images/4561/37885834270_5a379f_64sq.jpg',
          'felo_score': '730',
          'felo_tier': 'gold',
        }],
    }, {
      'team_key': '423.l.248982.t.3',
      'team_id': '3',
      'name': 'The Gutekunspirators',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/3',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/25299390185_0122c905c7.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 13,
      'number_of_moves': 2,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '3',
          'nickname': 'Ryan',
          'guid': 'M4VCDPWFETWPXCD6MGILBO5ZKE',
          'image_url': 'https://s.yimg.com/ag/images/4689/38448487774_95adad_64sq.jpg',
          'felo_score': '794',
          'felo_tier': 'gold',
        }],
    }, {
      'team_key': '423.l.248982.t.4',
      'team_id': '4',
      'name': 'Brown-Tainted Love',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/4',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/0ea6b46372b6b84eda1644b4d66ea9a257bd4e9758f7a267b3cae38be96dc00d.png',
        }],
      'division_id': '2',
      'waiver_priority': 6,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '4',
          'nickname': 'Justin',
          'guid': 'MYOPLHY3JKSC2AIMZV4RFZDM64',
          'image_url': 'https://s.yimg.com/ag/images/default_user_profile_pic_64sq.jpg',
          'felo_score': '744',
          'felo_tier': 'gold',
        }],
    }, {
      'team_key': '423.l.248982.t.5',
      'team_id': '5',
      'name': 'Putin the Butt',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/5',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/59597645812_36fee0.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 10,
      'number_of_moves': 1,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '5',
          'nickname': 'Erik',
          'guid': '2PHPERRYQTXRW5DMBJR2AL7G5I',
          'image_url': 'https://s.yimg.com/ag/images/4730/38419588835_f5a842_64sq.jpg',
          'felo_score': '843',
          'felo_tier': 'platinum',
        }],
    }, {
      'team_key': '423.l.248982.t.6',
      'team_id': '6',
      'name': 'Let Love Into Your Heart',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/6',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/3036b69ee5cb0633f9089f9ffdab715e7113e084a56e7be6bf230e89e32e125f.png',
        }],
      'division_id': '2',
      'waiver_priority': 4,
      'number_of_moves': 1,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '6',
          'nickname': 'Jacob',
          'guid': '4BV7VSGHH63EGFKNKPXDUB36WY',
          'image_url': 'https://s.yimg.com/ag/images/4567/37727909760_5d00dc_64sq.jpg',
          'felo_score': '586',
          'felo_tier': 'bronze',
        }],
    }, {
      'team_key': '423.l.248982.t.7',
      'team_id': '7',
      'name': 'Lemon Herbert Party',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/7',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/25202764631_8bc646a704.jpg',
        }],
      'division_id': '2',
      'waiver_priority': 8,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 191,
      'managers': [
        {
          'manager_id': '7',
          'nickname': 'Flaherty',
          'guid': 'RPDXRRSINEITQUPUOVRP5OR7TM',
          'is_commissioner': '1',
          'image_url': 'https://s.yimg.com/ag/images/4536/37425292353_d7d441_64sq.jpg',
          'felo_score': '759',
          'felo_tier': 'gold',
        }],
    }, {
      'team_key': '423.l.248982.t.8',
      'team_id': '8',
      'name': 'Just the (M)ete',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/8',
      'team_logos': [
        {
          'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_4_m.png',
        }],
      'division_id': '1',
      'waiver_priority': 2,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 199,
      'managers': [
        {
          'manager_id': '8',
          'nickname': 'Marki',
          'guid': '65VEFNBDYF6Q2IDN4TB6HEBRPA',
          'image_url': 'https://s.yimg.com/ag/images/default_user_profile_pic_64sq.jpg',
          'felo_score': '721',
          'felo_tier': 'gold',
        }],
    }, {
      'team_key': '423.l.248982.t.9',
      'team_id': '9',
      'name': 'Long Arm of T-Law',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/9',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/0a96a2ef02baf9d0bf8508a9e581d98a265f4458c682fabe148665b2d15d7f3d.png',
        }],
      'division_id': '1',
      'waiver_priority': 9,
      'number_of_moves': 1,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '9',
          'nickname': 'Carbunkle',
          'guid': 'QJFJEIAIR3SIG7QUZ65MCQER6Y',
          'image_url': 'https://s.yimg.com/ag/images/4735/24358305827_5c9865_64sq.jpg',
          'felo_score': '875',
          'felo_tier': 'platinum',
        }],
    }, {
      'team_key': '423.l.248982.t.10',
      'team_id': '10',
      'name': 'Purdy Mouth Pluggers',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/10',
      'team_logos': [
        {
          'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_4_a.png',
        }],
      'division_id': '2',
      'waiver_priority': 5,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 169,
      'managers': [
        {
          'manager_id': '10',
          'nickname': 'Andre',
          'guid': 'KKMORW344KO24ODLLE4MHYZHK4',
          'image_url': 'https://s.yimg.com/ag/images/4590/37623125843_ee8875_64sq.jpg',
          'felo_score': '589',
          'felo_tier': 'bronze',
        }],
    }, {
      'team_key': '423.l.248982.t.11',
      'team_id': '11',
      'name': 'Four and Out',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/11',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/39a5a1706d2673b164cf7e39d0df5afbf500fa179856d0a7b80536407bea8404.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 1,
      'number_of_moves': 2,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '2',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '11',
          'nickname': 'Joe',
          'guid': 'MFU6FR7LE2RJVSZQJ2TKNP2AVI',
          'image_url': 'https://s.yimg.com/ag/images/4551/37880323470_28947c_64sq.jpg',
          'felo_score': '590',
          'felo_tier': 'bronze',
        }],
    }, {
      'team_key': '423.l.248982.t.12',
      'team_id': '12',
      'name': 'Bris time for your Ju Chubb',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/12',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/1caacd8d59a286e9515cea28dfde2437ce74db5703805ee910fde8aff9be4e7d.jpg',
        }],
      'division_id': '2',
      'waiver_priority': 12,
      'number_of_moves': 3,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '12',
          'nickname': 'Peter',
          'guid': 'DBOVW7DZZPK2UT5DG25UXENEME',
          'image_url': 'https://s.yimg.com/ag/images/4593/38273803285_a8f7b7_64sq.jpg',
          'felo_score': '581',
          'felo_tier': 'bronze',
        }],
    }, {
      'team_key': '423.l.248982.t.13',
      'team_id': '13',
      'name': 'Kirko Drippin',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/13',
      'team_logos': [
        {
          'size': 'large',
          'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/b582b9972bee802197826e53d5cf77a753c9529026f24f58e61f289eebdd057f.jpg',
        }],
      'division_id': '1',
      'waiver_priority': 7,
      'number_of_moves': 0,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '13',
          'nickname': 'Keith Veldkamp',
          'guid': 'XBH54RNLU27TDXGT46AUJIPTKA',
          'image_url': 'https://s.yimg.com/ag/images/4586/37940255370_23ba0d_64sq.jpg',
          'felo_score': '571',
          'felo_tier': 'bronze',
        }],
    }, {
      'team_key': '423.l.248982.t.14',
      'team_id': '14',
      'name': 'Show me yo T-wat-Son',
      'url': 'https://football.fantasysports.yahoo.com/f1/248982/14',
      'team_logos': [
        {
          'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_2_n.png',
        }],
      'division_id': '2',
      'waiver_priority': 14,
      'number_of_moves': 6,
      'number_of_trades': 0,
      'roster_adds': {
        'coverage_type': 'week', 'coverage_value': 2, 'value': '4',
      },
      'league_scoring_type': 'head',
      'has_draft_grade': 0,
      'auction_budget_total': '200',
      'auction_budget_spent': 200,
      'managers': [
        {
          'manager_id': '14',
          'nickname': 'Nicolo',
          'guid': 'GV5YGXDODZCIPK2XSCBTPEDOMU',
          'image_url': 'https://s.yimg.com/ag/images/4735/39028432546_db479e_64sq.jpg',
          'felo_score': '708',
          'felo_tier': 'gold',
        }],
    }],
  'scoreboard': {
    'matchups': [
      {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.1',
            'team_id': '1',
            'name': 'Definitely Did A Murder',
            'is_owned_by_current_login': 1,
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/1',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/e05ef8b4aad08abe5c530d0d1c4f8d2c9004ffbd6debef69bf90876dccbac6a7.jpg',
              }],
            'division_id': '1',
            'waiver_priority': 3,
            'number_of_moves': 0,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '1',
                'nickname': 'Dan Perron',
                'guid': 'YV6IA52VPAIR3LUBAROLMDQJ2E',
                'is_commissioner': '1',
                'is_current_login': '1',
                'image_url': 'https://s.yimg.com/ag/images/4538/38397836431_6ec8df_64sq.jpg',
                'felo_score': '728',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '76.37',
            },
          }, {
            'team_key': '423.l.248982.t.13',
            'team_id': '13',
            'name': 'Kirko Drippin',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/13',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/b582b9972bee802197826e53d5cf77a753c9529026f24f58e61f289eebdd057f.jpg',
              }],
            'division_id': '1',
            'waiver_priority': 7,
            'number_of_moves': 0,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '13',
                'nickname': 'Keith Veldkamp',
                'guid': 'XBH54RNLU27TDXGT46AUJIPTKA',
                'image_url': 'https://s.yimg.com/ag/images/4586/37940255370_23ba0d_64sq.jpg',
                'felo_score': '571',
                'felo_tier': 'bronze',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '79.38',
            },
          }],
      }, {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.2',
            'team_id': '2',
            'name': 'Miles & Miles of Hard On',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/2',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/3db4f46bfdd5af0eaffa34063db3a43afd8f40236251b59851a03c771328cc37.jpg',
              }],
            'division_id': '2',
            'waiver_priority': 11,
            'number_of_moves': 2,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '2',
                'nickname': 'Stark',
                'guid': 'J2IEURO2ZD4G73OVMZMPPMKIXM',
                'image_url': 'https://s.yimg.com/ag/images/4561/37885834270_5a379f_64sq.jpg',
                'felo_score': '730',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '82.89',
            },
          }, {
            'team_key': '423.l.248982.t.5',
            'team_id': '5',
            'name': 'Putin the Butt',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/5',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/59597645812_36fee0.jpg',
              }],
            'division_id': '1',
            'waiver_priority': 10,
            'number_of_moves': 1,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '5',
                'nickname': 'Erik',
                'guid': '2PHPERRYQTXRW5DMBJR2AL7G5I',
                'image_url': 'https://s.yimg.com/ag/images/4730/38419588835_f5a842_64sq.jpg',
                'felo_score': '843',
                'felo_tier': 'platinum',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '80.36',
            },
          }],
      }, {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.3',
            'team_id': '3',
            'name': 'The Gutekunspirators',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/3',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/25299390185_0122c905c7.jpg',
              }],
            'division_id': '1',
            'waiver_priority': 13,
            'number_of_moves': 2,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '3',
                'nickname': 'Ryan',
                'guid': 'M4VCDPWFETWPXCD6MGILBO5ZKE',
                'image_url': 'https://s.yimg.com/ag/images/4689/38448487774_95adad_64sq.jpg',
                'felo_score': '794',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '76.40',
            },
          }, {
            'team_key': '423.l.248982.t.11',
            'team_id': '11',
            'name': 'Four and Out',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/11',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/39a5a1706d2673b164cf7e39d0df5afbf500fa179856d0a7b80536407bea8404.jpg',
              }],
            'division_id': '1',
            'waiver_priority': 1,
            'number_of_moves': 2,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '2',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '11',
                'nickname': 'Joe',
                'guid': 'MFU6FR7LE2RJVSZQJ2TKNP2AVI',
                'image_url': 'https://s.yimg.com/ag/images/4551/37880323470_28947c_64sq.jpg',
                'felo_score': '590',
                'felo_tier': 'bronze',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '87.47',
            },
          }],
      }, {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.4',
            'team_id': '4',
            'name': 'Brown-Tainted Love',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/4',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/0ea6b46372b6b84eda1644b4d66ea9a257bd4e9758f7a267b3cae38be96dc00d.png',
              }],
            'division_id': '2',
            'waiver_priority': 6,
            'number_of_moves': 0,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '4',
                'nickname': 'Justin',
                'guid': 'MYOPLHY3JKSC2AIMZV4RFZDM64',
                'image_url': 'https://s.yimg.com/ag/images/default_user_profile_pic_64sq.jpg',
                'felo_score': '744',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '76.29',
            },
          }, {
            'team_key': '423.l.248982.t.7',
            'team_id': '7',
            'name': 'Lemon Herbert Party',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/7',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/25202764631_8bc646a704.jpg',
              }],
            'division_id': '2',
            'waiver_priority': 8,
            'number_of_moves': 0,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 191,
            'managers': [
              {
                'manager_id': '7',
                'nickname': 'Flaherty',
                'guid': 'RPDXRRSINEITQUPUOVRP5OR7TM',
                'is_commissioner': '1',
                'image_url': 'https://s.yimg.com/ag/images/4536/37425292353_d7d441_64sq.jpg',
                'felo_score': '759',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '88.45',
            },
          }],
      }, {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.6',
            'team_id': '6',
            'name': 'Let Love Into Your Heart',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/6',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/3036b69ee5cb0633f9089f9ffdab715e7113e084a56e7be6bf230e89e32e125f.png',
              }],
            'division_id': '2',
            'waiver_priority': 4,
            'number_of_moves': 1,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '6',
                'nickname': 'Jacob',
                'guid': '4BV7VSGHH63EGFKNKPXDUB36WY',
                'image_url': 'https://s.yimg.com/ag/images/4567/37727909760_5d00dc_64sq.jpg',
                'felo_score': '586',
                'felo_tier': 'bronze',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '74.47',
            },
          }, {
            'team_key': '423.l.248982.t.10',
            'team_id': '10',
            'name': 'Purdy Mouth Pluggers',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/10',
            'team_logos': [
              {
                'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_4_a.png',
              }],
            'division_id': '2',
            'waiver_priority': 5,
            'number_of_moves': 0,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 169,
            'managers': [
              {
                'manager_id': '10',
                'nickname': 'Andre',
                'guid': 'KKMORW344KO24ODLLE4MHYZHK4',
                'image_url': 'https://s.yimg.com/ag/images/4590/37623125843_ee8875_64sq.jpg',
                'felo_score': '589',
                'felo_tier': 'bronze',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '81.49',
            },
          }],
      }, {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.8',
            'team_id': '8',
            'name': 'Just the (M)ete',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/8',
            'team_logos': [
              {
                'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_4_m.png',
              }],
            'division_id': '1',
            'waiver_priority': 2,
            'number_of_moves': 0,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '0',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 199,
            'managers': [
              {
                'manager_id': '8',
                'nickname': 'Marki',
                'guid': '65VEFNBDYF6Q2IDN4TB6HEBRPA',
                'image_url': 'https://s.yimg.com/ag/images/default_user_profile_pic_64sq.jpg',
                'felo_score': '721',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '70.42',
            },
          }, {
            'team_key': '423.l.248982.t.9',
            'team_id': '9',
            'name': 'Long Arm of T-Law',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/9',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/0a96a2ef02baf9d0bf8508a9e581d98a265f4458c682fabe148665b2d15d7f3d.png',
              }],
            'division_id': '1',
            'waiver_priority': 9,
            'number_of_moves': 1,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '9',
                'nickname': 'Carbunkle',
                'guid': 'QJFJEIAIR3SIG7QUZ65MCQER6Y',
                'image_url': 'https://s.yimg.com/ag/images/4735/24358305827_5c9865_64sq.jpg',
                'felo_score': '875',
                'felo_tier': 'platinum',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '83.55',
            },
          }],
      }, {
        'week': '2',
        'week_start': '2023-09-12',
        'week_end': '2023-09-18',
        'status': 'midevent',
        'is_playoffs': '0',
        'is_consolation': '0',
        'is_matchup_recap_available': 0,
        'teams': [
          {
            'team_key': '423.l.248982.t.12',
            'team_id': '12',
            'name': 'Bris time for your Ju Chubb',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/12',
            'team_logos': [
              {
                'size': 'large',
                'url': 'https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/1caacd8d59a286e9515cea28dfde2437ce74db5703805ee910fde8aff9be4e7d.jpg',
              }],
            'division_id': '2',
            'waiver_priority': 12,
            'number_of_moves': 3,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '1',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '12',
                'nickname': 'Peter',
                'guid': 'DBOVW7DZZPK2UT5DG25UXENEME',
                'image_url': 'https://s.yimg.com/ag/images/4593/38273803285_a8f7b7_64sq.jpg',
                'felo_score': '581',
                'felo_tier': 'bronze',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '82.75',
            },
          }, {
            'team_key': '423.l.248982.t.14',
            'team_id': '14',
            'name': 'Show me yo T-wat-Son',
            'url': 'https://football.fantasysports.yahoo.com/f1/248982/14',
            'team_logos': [
              {
                'size': 'large', 'url': 'https://s.yimg.com/cv/apiv2/default/nfl/nfl_2_n.png',
              }],
            'division_id': '2',
            'waiver_priority': 14,
            'number_of_moves': 6,
            'number_of_trades': 0,
            'roster_adds': {
              'coverage_type': 'week', 'coverage_value': 2, 'value': '4',
            },
            'league_scoring_type': 'head',
            'has_draft_grade': 0,
            'auction_budget_total': '200',
            'auction_budget_spent': 200,
            'managers': [
              {
                'manager_id': '14',
                'nickname': 'Nicolo',
                'guid': 'GV5YGXDODZCIPK2XSCBTPEDOMU',
                'image_url': 'https://s.yimg.com/ag/images/4735/39028432546_db479e_64sq.jpg',
                'felo_score': '708',
                'felo_tier': 'gold',
              }],
            'points': {
              'coverage_type': 'week', 'week': '2', 'total': '0.00',
            },
            'projected_points': {
              'coverage_type': 'week', 'week': '2', 'total': '71.13',
            },
          }],
      }],
  },
};

const leagueDataMap = {
  item: {
    name: 'name', num_teams: 'num_teams', current_week: 'current_week', teams: 'standings',
  },
  operate: [
    {
      run: (teams) => transform(teams, teamDataMap), on: 'teams',
    }],
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
    standings_data: 'standings',
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

let leagueData = transform(data, leagueDataMap);
console.log(JSON.stringify(leagueData, null, 2));
console.log(leagueData.toString())
console.log(util.inspect(leagueData))