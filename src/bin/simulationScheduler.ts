import type { SimulationRunState } from '../utils/simulation.js';
import { sendOotpMessage } from '../utils/slack.js';
import {
  haveAllTeamsSubmitted,
  getWaitingTeamsMessage,
  checkFiles,
} from './ootpFileManager.js';
import { callSimulateEndpoint } from '../clients/windows-facilitator.js';
import cron from 'node-cron';
import {
  getActiveSimulation,
  getScheduledSimulation,
  getSimulationPauses,
  updateScheduledSimulation,
} from '../clients/mongo/index.js';
import { simulationLogger } from '../utils/logging/index.js';

// Function to check and send reminders
async function checkAndSendReminders(runState: SimulationRunState) {
  const hoursUntilNext =
    (runState.scheduledFor.getTime() - new Date().getTime()) / (1000 * 60 * 60);

  // Get list of teams that haven't submitted
  const waitingOnTeams = await getWaitingTeamsMessage();

  // Send 24-hour reminder if not already sent
  if (hoursUntilNext <= 24 && !runState.remindersSent?.twentyFourHours) {
    await sendOotpMessage(
      `⏰ Reminder: 24 hours until next simulation! Waiting on: ${waitingOnTeams}`
    );
    if (!runState.remindersSent) {
      runState.remindersSent = {};
    }
    runState.remindersSent.twentyFourHours = true;
    await updateScheduledSimulation({
      remindersSent: runState.remindersSent,
    });
  }

  // Send 12-hour reminder if not already sent
  if (hoursUntilNext <= 12 && !runState.remindersSent?.twelveHours) {
    await sendOotpMessage(
      `⏰ Reminder: 12 hours until next simulation! Still waiting on: ${waitingOnTeams}`
    );
    if (!runState.remindersSent) {
      runState.remindersSent = {};
    }
    runState.remindersSent.twelveHours = true;
    await updateScheduledSimulation({
      remindersSent: runState.remindersSent,
    });
  }
}

// Function to check if we need to run a simulation
export async function checkAndRunSimulation() {
  const activeState = await getActiveSimulation();

  // Check if there's already a simulation in progress
  if (activeState?.status === 'started' || activeState?.status === 'failed') {
    simulationLogger.debug('Simulation already in progress, skipping run', {
      status: activeState.status,
    });
    return;
  }

  const scheduledState = await getScheduledSimulation();

  // Check if all teams have submitted their turns
  const { oldFiles } = await checkFiles();
  const allTeamsSubmitted = await haveAllTeamsSubmitted(oldFiles);

  if (scheduledState?.scheduledFor < new Date() || allTeamsSubmitted) {
    const state = await getSimulationPauses();
    if (state.length > 0) {
      simulationLogger.debug('Simulation is paused, skipping scheduled run', {
        pauseCount: state.length,
      });
      return;
    }
    const reason = allTeamsSubmitted
      ? 'all teams have submitted their turns'
      : '48-hour interval has passed';
    const triggerType = allTeamsSubmitted ? 'players_ready' : 'scheduler';
    await sendOotpMessage(`🔄 Starting scheduled simulation (${reason})...`);
    try {
      await callSimulateEndpoint({
        options: scheduledState?.options,
        triggerType,
      });
    } catch (error) {
      await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
    }
  } else if (scheduledState?.scheduledFor) {
    // Check and send reminders if needed
    await checkAndSendReminders(scheduledState);
  }
}

// Also check when pauses are removed
export async function checkPausesRemoved() {
  const state = await getSimulationPauses();
  if (state.length === 0) {
    const runState = await getActiveSimulation();
    if (runState.skippedRun) {
      simulationLogger.info(
        'All pauses removed and there was a skipped run, executing now'
      );
      await sendOotpMessage('🔄 Resuming previously skipped simulation...');
      try {
        await callSimulateEndpoint({
          options: runState.options,
          triggerType: 'resumed',
        });
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

simulationLogger.info('Simulation scheduler initialized');
