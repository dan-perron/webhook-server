import * as mongo from '../clients/mongo.js';
import { checkPausesRemoved } from '../bin/simulationScheduler.js';
import { ObjectId } from 'mongodb';
import dayjs from 'dayjs';

export interface CommishCheckboxConfig {
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

/**
 * Type definition for the simulation run state
 */
export interface SimulationRunState {
  _id?: ObjectId;
  lastScheduledRun?: Date | null;
  skippedRun?: boolean;
  createdAt?: Date;
  completedAt?: Date;
  status?:
    | 'scheduled'
    | 'skipped'
    | 'completed'
    | 'failed'
    | 'dry_run'
    | 'started';
  reason?: string;
  triggeredBy?: string;
  remindersSent?: {
    twentyFourHours?: boolean;
    twelveHours?: boolean;
  };
  options?: {
    backupLeagueFolder?: boolean;
    manualImportTeams?: boolean;
    commishCheckboxes?: CommishCheckboxConfig;
    dryRun?: boolean;
  };
}

/**
 * Resumes a simulation pause and checks if we should run a skipped simulation
 * @param pauseId The ID of the pause to resume (e.g. 'system_league_file', 'system_archive_file', or a user ID)
 * @returns true if the pause was resumed, false if no active pause was found
 */
export async function resumeSimulationPause(pauseId: string): Promise<boolean> {
  const resumed = await mongo.resumeSimulationPause(pauseId);
  if (resumed) {
    console.log(`${pauseId} pause removed`);
    await checkPausesRemoved();
  }
  return resumed;
}

/**
 * Resumes all simulation pauses and checks if we should run a skipped simulation
 * @returns The number of pauses that were resumed
 */
export async function resumeAllSimulationPauses(): Promise<number> {
  const count = await mongo.resumeAllSimulationPauses();
  if (count > 0) {
    console.log(`Resumed ${count} simulation pauses`);
    await checkPausesRemoved();
  }
  return count;
}

/**
 * Adds a simulation pause
 * @param pauseId The ID of the pause to add (e.g. 'system_league_file', 'system_archive_file', or a user ID)
 */
export async function addSimulationPause(pauseId: string): Promise<void> {
  await mongo.addSimulationPause(pauseId);
  console.log(`Added ${pauseId} pause`);
}

/**
 * Gets the current simulation state
 * @returns Array of active simulation pauses
 */
export async function getSimulationState() {
  return await mongo.getSimulationState();
}

/**
 * Updates the simulation run state
 * @param state The new run state to set
 */
export async function updateSimulationRunState(
  state: SimulationRunState
): Promise<void> {
  return await mongo.updateSimulationRunState(state);
}

export function formatSimulationHistoryEntry(sim: SimulationRunState): string {
  const timeAgo = dayjs().diff(dayjs(sim.createdAt), 'minute');
  const days = Math.floor(timeAgo / (24 * 60));
  const hours = Math.floor((timeAgo % (24 * 60)) / 60);
  const minutes = timeAgo % 60;

  let timeDisplay = '';
  if (days > 0) {
    timeDisplay += `${days}d `;
  }
  if (hours > 0 || days > 0) {
    timeDisplay += `${hours}h `;
  }
  timeDisplay += `${minutes}m`;

  let status: string;
  switch (sim.status) {
    case 'failed':
      status = '❌';
      break;
    case 'skipped':
      status = '⏸️';
      break;
    case 'completed':
      status = '✅';
      break;
    case 'dry_run':
      status = '🧪';
      break;
    default:
      status = '🔄';
  }

  let message = `${status} ${timeDisplay} ago: ${sim.status}`;
  if (sim.reason) {
    message += ` (${sim.reason})`;
  }
  if (sim.triggeredBy) {
    message += ` by ${sim.triggeredBy}`;
  }
  return message;
}
