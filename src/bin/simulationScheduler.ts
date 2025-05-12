import axios from 'axios';
import config from 'config';
import cron from 'node-cron';
import { ObjectId } from 'mongodb';
import * as mongo from '../clients/mongo.js';
import { addSimulationPause, getSimulationState, getSimulationRunState, updateSimulationRunState } from '../utils/simulation.js';
import type { SimulationRunState } from '../utils/simulation.js';
import { sendOotpMessage, sendOotpDebugMessage } from '../utils/slack.js';
import { haveAllTeamsSubmitted } from './ootpFileManager.js';

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

const pathToTeamUploads = '/ootp/game/team_uploads/';

// Function to call the simulate endpoint
async function callSimulateEndpoint(isResumedSimulation = false, options = { 
  backupLeagueFolder: true,
  manualImportTeams: false,
  commishCheckboxes: {} as CommishCheckboxConfig
}) {
  try {
    const simulateEndpoint = `http://${config.get('simulation.hostname')}/simulate`;
    const response = await axios.post(simulateEndpoint, {
      backup_league_folder: options.backupLeagueFolder,
      manual_import_teams: options.manualImportTeams,
      commish_checkboxes: options.commishCheckboxes
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Simulate endpoint response:', response.data);
    
    // Send response to debug channel
    await sendOotpDebugMessage(`Simulate endpoint response: ${JSON.stringify(response.data, null, 2)}`);
    
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
        commishCheckboxes: options.commishCheckboxes
      }
    });
  } catch (error) {
    console.error('Error calling simulate endpoint:', error);
    // Send error details to debug channel
    await sendOotpDebugMessage(`Simulate endpoint error: ${JSON.stringify(error, null, 2)}`);
    
    // Update state to failed
    await updateSimulationRunState({
      status: 'failed',
      reason: error.message,
      lastScheduledRun: new Date(),
      skippedRun: false,
      createdAt: new Date()
    });
    
    throw error;
  }
}

// Function to check if we need to run a simulation
export async function checkAndRunSimulation() {
  const state = await getSimulationState();
  if (state.length > 0) {
    console.log('Simulation is paused, skipping scheduled run');
    await updateSimulationRunState({
      lastScheduledRun: new Date(),
      skippedRun: true,
      status: 'skipped',
      reason: 'Simulation is paused',
      triggeredBy: 'scheduler',
      createdAt: new Date()
    });
    return;
  }

  const runState = await getSimulationRunState();
  
  // Check if there's already a simulation in progress
  if (runState && runState.status === 'scheduled') {
    console.log('Simulation already in progress, skipping scheduled run');
    return;
  }

  const lastRun = runState.lastScheduledRun;
  const now = new Date();
  
  // Check if 48 hours have passed since the last run
  const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
  
  // Check if all teams have submitted their turns
  const allTeamsSubmitted = await haveAllTeamsSubmitted();
  
  if (hoursSinceLastRun >= 48 || allTeamsSubmitted) {
    const reason = allTeamsSubmitted ? 'all teams have submitted their turns' : '48-hour interval has passed';
    await sendOotpMessage(`🔄 Starting scheduled simulation (${reason})...`);
    try {
      await callSimulateEndpoint(false);
    } catch (error) {
      await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
    }
  } else {
    console.log(`Not enough time has passed since last run (${hoursSinceLastRun.toFixed(2)} hours) and not all teams have submitted`);
  }
}

// Also check when pauses are removed
export async function checkPausesRemoved() {
  const state = await getSimulationState();
  if (state.length === 0) {
    const runState = await getSimulationRunState();
    if (runState.skippedRun) {
      console.log('All pauses removed and there was a skipped run, executing now');
      await sendOotpMessage('🔄 Resuming previously skipped simulation...');
      try {
        await callSimulateEndpoint(true);
      } catch (error) {
        await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
      }
    }
  }
}

// Check every minute if it's time to run a simulation
cron.schedule('* * * * *', () => {
  console.log('Checking if simulation should run at:', new Date().toISOString());
  checkAndRunSimulation();
});

console.log('Simulation scheduler initialized'); 