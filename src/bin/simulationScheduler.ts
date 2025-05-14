import {
  getSimulationState,
  getSimulationRunState,
  updateSimulationRunState,
} from '../utils/simulation.js';
import type { SimulationRunState } from '../utils/simulation.js';
import { sendOotpMessage } from '../utils/slack.js';
import {
  haveAllTeamsSubmitted,
  getWaitingTeamsMessage,
} from './ootpFileManager.js';
import { callSimulateEndpoint } from '../clients/windows-facilitator.js';
import cron from 'node-cron';
import * as mongo from '../clients/mongo.js';

// Function to check and send reminders
async function checkAndSendReminders(
  lastRun: Date,
  now: Date,
  runState: SimulationRunState
) {
  const hoursUntilNext =
    48 - (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  // Get list of teams that haven't submitted
  const waitingOnTeams = await getWaitingTeamsMessage();

  // Send 24-hour reminder if not already sent
  if (hoursUntilNext <= 24 && !runState.remindersSent?.twentyFourHours) {
    await sendOotpMessage(
      `⏰ Reminder: 24 hours until next simulation! ${waitingOnTeams}`
    );
    runState.remindersSent.twentyFourHours = true;
    await updateSimulationRunState(runState);
  }

  // Send 12-hour reminder if not already sent
  if (hoursUntilNext <= 12 && !runState.remindersSent?.twelveHours) {
    await sendOotpMessage(
      `⏰ Reminder: 12 hours until next simulation! Still waiting on: ${waitingOnTeams}`
    );
    runState.remindersSent.twelveHours = true;
    await updateSimulationRunState(runState);
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
    });
    return;
  }

  const runState = await getSimulationRunState();

  // Check if there's already a simulation in progress
  if (runState && runState.status === 'started') {
    console.log('Simulation already in progress, skipping run');
    return;
  }

  // Get the last completed simulation run
  const lastCompletedRun = await mongo.getLastCompletedSimulation();
  const now = new Date();

  // If no completed runs found, use current time as reference
  const lastRun = lastCompletedRun?.completedAt || now;

  // Check if 48 hours have passed since the last run
  const hoursSinceLastRun =
    (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  // Check if all teams have submitted their turns
  const allTeamsSubmitted = await haveAllTeamsSubmitted();

  if (hoursSinceLastRun >= 48 || allTeamsSubmitted) {
    const reason = allTeamsSubmitted
      ? 'all teams have submitted their turns'
      : '48-hour interval has passed';
    const triggerType = allTeamsSubmitted ? 'players_ready' : 'scheduler';
    await sendOotpMessage(`🔄 Starting scheduled simulation (${reason})...`);
    try {
      await callSimulateEndpoint({ triggerType });
    } catch (error) {
      await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
    }
  } else {
    // Check and send reminders if needed
    await checkAndSendReminders(lastRun, now, runState || {});
  }
}

// Also check when pauses are removed
export async function checkPausesRemoved() {
  const state = await getSimulationState();
  if (state.length === 0) {
    const runState = await getSimulationRunState();
    if (runState.skippedRun) {
      console.log(
        'All pauses removed and there was a skipped run, executing now'
      );
      await sendOotpMessage('🔄 Resuming previously skipped simulation...');
      try {
        await callSimulateEndpoint({ triggerType: 'resumed' });
      } catch (error) {
        await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
      }
    }
  }
}

// Check every minute if it's time to run a simulation
cron.schedule('* * * * *', () => {
  checkAndRunSimulation();
});

console.log('Simulation scheduler initialized');
