import axios from 'axios';
import config from 'config';
import cron from 'node-cron';
import * as mongo from '../clients/mongo.js';
import { addSimulationPause, getSimulationState, getSimulationRunState, updateSimulationRunState } from '../utils/simulation.js';
import { sendOotpMessage, sendOotpDebugMessage } from '../utils/slack.js';

// Function to call the simulate endpoint
async function callSimulateEndpoint(isResumedSimulation = false) {
  try {
    // Notify that simulation is starting
    await sendOotpMessage(
      isResumedSimulation ? '🔄 Resuming previously skipped simulation...' : '🔄 Starting scheduled simulation...'
    );

    const simulateEndpoint = `http://${config.get('simulation.hostname')}/simulate`;
    const response = await axios.post(simulateEndpoint);
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
      skippedRun: false
    });
  } catch (error) {
    console.error('Error calling simulate endpoint:', error);
    // Notify about the error
    await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
    // Send error details to debug channel
    await sendOotpDebugMessage(`Simulate endpoint error: ${JSON.stringify(error, null, 2)}`);
  }
}

// Function to check if we need to run a simulation
async function checkAndRunSimulation() {
  const state = await getSimulationState();
  if (state.length > 0) {
    console.log('Simulation is paused, skipping scheduled run');
    await updateSimulationRunState({
      lastScheduledRun: new Date(),
      skippedRun: true
    });
    return;
  }
  await callSimulateEndpoint(false);
}

// Schedule the cron job to run every hour from 9 AM to 6 PM Central Time
cron.schedule('0 9-18 * * *', () => {
  console.log('Running scheduled simulation at:', new Date().toISOString());
  checkAndRunSimulation();
});

// Also check when pauses are removed
export async function checkPausesRemoved() {
  const state = await getSimulationState();
  if (state.length === 0) {
    const runState = await getSimulationRunState();
    if (runState.skippedRun) {
      console.log('All pauses removed and there was a skipped run, executing now');
      await callSimulateEndpoint(true);
    }
  }
}

console.log('Simulation scheduler initialized'); 