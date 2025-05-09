import * as mongo from '../clients/mongo.js';
import { checkPausesRemoved } from '../bin/simulationScheduler.js';

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
 * Gets the current simulation run state
 * @returns The current run state including last scheduled run and skipped run status
 */
export async function getSimulationRunState() {
  return await mongo.getSimulationRunState();
}

/**
 * Updates the simulation run state
 * @param state The new run state to set
 */
export async function updateSimulationRunState(state: { lastScheduledRun: Date; skippedRun: boolean }) {
  return await mongo.updateSimulationRunState(state);
} 