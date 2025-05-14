import {
  getSimulationState,
  getSimulationRunState,
  updateSimulationRunState,
} from '../utils/simulation.js';
import { sendOotpMessage } from '../utils/slack.js';
import { haveAllTeamsSubmitted } from './ootpFileManager.js';
import { callSimulateEndpoint } from '../clients/windows-facilitator.js';
import cron from 'node-cron';

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
  if (runState && runState.status === 'scheduled') {
    console.log('Simulation already in progress, skipping scheduled run');
    return;
  }

  const lastRun = runState.lastScheduledRun;
  const now = new Date();

  // Check if 48 hours have passed since the last run
  const hoursSinceLastRun =
    (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  // Check if all teams have submitted their turns
  const allTeamsSubmitted = await haveAllTeamsSubmitted();

  if (hoursSinceLastRun >= 48 || allTeamsSubmitted) {
    const reason = allTeamsSubmitted
      ? 'all teams have submitted their turns'
      : '48-hour interval has passed';
    await sendOotpMessage(`🔄 Starting scheduled simulation (${reason})...`);
    try {
      await callSimulateEndpoint({ triggerType: 'scheduler' });
    } catch (error) {
      await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
    }
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
