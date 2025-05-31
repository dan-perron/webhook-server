import axios from 'axios';
import config from 'config';
import { sendOotpDebugMessage } from '../utils/slack.js';
import {
  addSimulationPause,
  updateActiveSimulation,
  updateScheduledSimulation,
} from './mongo/index.js';

interface CommishCheckboxConfig {
  [key: string]: boolean | number | undefined;
  backup_league_files: boolean;
  retrieve_team_exports_from_server: boolean;
  retrieve_team_exports_from_your_pc: boolean;
  break_if_team_files_are_missing: boolean;
  break_if_trades_are_pending: boolean;
  demote_release_players_with_dfa_time_left_of_x_days_or_less: boolean;
  auto_play_days: boolean;
  create_and_upload_league_file: boolean;
  create_and_upload_html_reports: boolean;
  create_sql_dump_for_ms_access: boolean;
  create_sql_dump_for_mysql: boolean;
  export_data_to_csv_files: boolean;
  upload_status_report_to_server: boolean;
  create_and_send_result_emails: boolean;
  dfa_days_value?: number;
  auto_play_days_value?: number;
}

interface SimulateOptions {
  backupLeagueFolder?: boolean;
  manualImportTeams?: boolean;
  dryRun?: boolean;
  commishCheckboxes?: CommishCheckboxConfig;
}

interface SimulateParams {
  options?: SimulateOptions;
  triggerType: 'manual' | 'scheduler' | 'resumed' | 'players_ready';
}

function transformToSnakeCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(transformToSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      acc[snakeKey] = transformToSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

export async function callSimulateEndpoint({
  options = {
    backupLeagueFolder: true,
    manualImportTeams: false,
    dryRun: false,
    commishCheckboxes: {} as CommishCheckboxConfig,
  },
  triggerType,
}: SimulateParams) {
  if (options.commishCheckboxes.auto_play_days_value === undefined) {
    options.commishCheckboxes.auto_play_days_value = 7;
  }

  // Update run state
  await updateScheduledSimulation({
    scheduledFor: new Date(),
    skippedRun: false,
    status: 'started',
    triggeredBy: triggerType,
    options: {
      backupLeagueFolder: options.backupLeagueFolder,
      manualImportTeams: options.manualImportTeams,
      commishCheckboxes: options.commishCheckboxes,
      dryRun: options.dryRun,
    },
  });

  try {
    const simulateEndpoint = `http://${config.get('simulation.hostname')}/simulate`;
    const response = await axios.post(
      simulateEndpoint,
      transformToSnakeCase(options),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Simulate endpoint response:', response.data);

    // Send response to debug channel
    await sendOotpDebugMessage(
      `Simulate endpoint response: ${JSON.stringify(response.data, null, 2)}`
    );

    if (options.dryRun) {
      await updateActiveSimulation({
        status: 'dry_run',
      });
    } else {
      // Add system pauses for both files only if not in dry-run mode
      await addSimulationPause('system_league_file');
      await addSimulationPause('system_archive_file');
      console.log(
        'Simulation automatically paused until both files are updated'
      );
    }

    return { success: true, data: response.data };
  } catch (error) {
    // Update state to failed if there's an error
    await updateActiveSimulation({
      status: 'failed',
      reason: error.message,
    });
    throw error;
  }
}

export async function checkFacilitatorHealth() {
  try {
    const healthEndpoint = `http://${config.get('simulation.hostname')}/health`;
    const response = await axios.get(healthEndpoint);
    return {
      healthy: response.data.status === 'ok',
      message: response.data.message,
    };
  } catch (error) {
    return {
      healthy: false,
      message:
        error.response?.data?.message ||
        'Failed to connect to windows-facilitator',
    };
  }
}
