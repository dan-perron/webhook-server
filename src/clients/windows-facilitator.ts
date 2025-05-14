import axios from 'axios';
import config from 'config';
import { sendOotpDebugMessage } from '../utils/slack.js';
import { addSimulationPause } from '../utils/simulation.js';
import { updateSimulationRunState } from '../utils/simulation.js';
import { getSimulationState } from '../utils/simulation.js';
import { getSimulationRunState } from '../utils/simulation.js';
import { getSimulationHistory } from '../clients/mongo.js';
import dayjs from 'dayjs';

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
  backupLeagueFolder: boolean;
  manualImportTeams: boolean;
  dryRun: boolean;
  commishCheckboxes: CommishCheckboxConfig;
}

export async function callSimulateEndpoint(
  options: SimulateOptions = {
    backupLeagueFolder: true,
    manualImportTeams: false,
    dryRun: false,
    commishCheckboxes: {} as CommishCheckboxConfig,
  },
  isResumedSimulation = false
) {
  if (options.commishCheckboxes.auto_play_days_value === undefined) {
    options.commishCheckboxes.auto_play_days_value = 7;
  }

  try {
    const simulateEndpoint = `http://${config.get('simulation.hostname')}/simulate`;
    const response = await axios.post(simulateEndpoint, options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Simulate endpoint response:', response.data);

    // Send response to debug channel
    await sendOotpDebugMessage(
      `Simulate endpoint response: ${JSON.stringify(response.data, null, 2)}`
    );

    // Add system pauses for both files
    await addSimulationPause('system_league_file');
    await addSimulationPause('system_archive_file');
    console.log('Simulation automatically paused until both files are updated');

    // Update run state
    await updateSimulationRunState({
      lastScheduledRun: new Date(),
      skippedRun: false,
      status: 'scheduled',
      triggeredBy: isResumedSimulation ? 'resumed' : 'scheduled',
      createdAt: new Date(),
      options: {
        backupLeagueFolder: options.backupLeagueFolder,
        manualImportTeams: options.manualImportTeams,
        commishCheckboxes: options.commishCheckboxes,
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error calling simulate endpoint:', error);
    // Send error details to debug channel
    await sendOotpDebugMessage(
      `Simulate endpoint error: ${JSON.stringify(error, null, 2)}`
    );

    // Update state to failed
    await updateSimulationRunState({
      status: 'failed',
      reason: error.message,
      lastScheduledRun: new Date(),
      skippedRun: false,
      createdAt: new Date(),
    });

    throw error;
  }
}

export async function getSimulationStatus() {
  const state = await getSimulationState();
  const runState = await getSimulationRunState();
  const history = await getSimulationHistory(5);

  let nextSimMessage = '';
  if (runState.lastScheduledRun) {
    const nextSimTime = new Date(
      runState.lastScheduledRun.getTime() + 48 * 60 * 60 * 1000
    );
    const now = new Date();
    const hoursUntilNext =
      (nextSimTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilNext > 0) {
      const days = Math.floor(hoursUntilNext / 24);
      const hours = Math.floor(hoursUntilNext % 24);
      nextSimMessage = `\nNext simulation in: ${days}d ${hours}h`;
    } else {
      nextSimMessage = '\nNext simulation is due now';
    }
  }

  let message = '';
  if (state.length === 0) {
    message = `Simulation is not paused.${nextSimMessage}\n\n`;
  } else {
    const systemPauses = state.filter((pause) =>
      pause.userId.startsWith('system_')
    );
    const userPauses = state.filter(
      (pause) => !pause.userId.startsWith('system_')
    );

    if (userPauses.length > 0) {
      const pauseList = userPauses
        .map((pause) => {
          const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
          return `• <@${pause.userId}> (${timeAgo} minutes ago)`;
        })
        .join('\n');
      message = `Simulation is currently paused by:\n${pauseList}\n\n`;
    } else {
      message = "Simulation is currently running, we're waiting for:\n";
      const systemPauseList = systemPauses
        .map((pause) => {
          const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
          return `• ${pause.userId.replace('system_', '')} file (${timeAgo} minutes ago)`;
        })
        .join('\n');
      message += `${systemPauseList}\n\n`;
    }
  }

  // Add simulation history
  if (history.length > 0) {
    message += 'Recent simulation history:\n';
    history.forEach((sim) => {
      const timeAgo = dayjs().diff(dayjs(sim.createdAt), 'minute');
      const status =
        sim.status === 'failed'
          ? '❌'
          : sim.status === 'skipped'
            ? '⏸️'
            : sim.status === 'completed'
              ? '✅'
              : '🔄';
      message += `${status} ${timeAgo}m ago: ${sim.status}`;
      if (sim.reason) {
        message += ` (${sim.reason})`;
      }
      if (sim.triggeredBy) {
        message += ` by ${sim.triggeredBy}`;
      }
      message += '\n';
    });
  }

  return message;
}
