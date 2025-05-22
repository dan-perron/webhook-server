import { database } from '../connection.js';
import type {
  SimulationPause,
  SimulationState,
  SimulationStatus,
} from '../types.js';
import { SimulationStateMachine } from '../../../utils/simulationStateMachine.js';

export const TERMINAL_STATUSES: SimulationStatus[] = [
  'completed',
  'failed',
  'skipped',
  'dry_run',
];

export async function getSimulationState(): Promise<SimulationPause[]> {
  const result = await database
    .collection('simulation_pauses')
    .find({ resumedAt: { $exists: false } })
    .sort({ pausedAt: 1 })
    .toArray();
  return result as unknown as SimulationPause[];
}

export async function addSimulationPause(userId: string): Promise<void> {
  const pause: SimulationPause = {
    userId,
    pausedAt: new Date(),
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  await database.collection('simulation_pauses').insertOne(pause);
}

export async function resumeSimulationPause(userId: string): Promise<boolean> {
  const result = await database
    .collection('simulation_pauses')
    .updateOne(
      { userId, resumedAt: { $exists: false } },
      { $set: { resumedAt: new Date(), updatedAt: new Date() } }
    );
  return result.modifiedCount > 0;
}

export async function resumeAllSimulationPauses(): Promise<number> {
  const result = await database
    .collection('simulation_pauses')
    .updateMany(
      { resumedAt: { $exists: false } },
      { $set: { resumedAt: new Date(), updatedAt: new Date() } }
    );
  return result.modifiedCount;
}

export async function getActiveSimulation(): Promise<SimulationState | null> {
  const result = await database
    .collection('simulation_state')
    .findOne({}, { sort: { createdAt: -1 } });

  if (!TERMINAL_STATUSES.includes(result?.status)) {
    return result as SimulationState;
  }

  return null;
}

export async function updateSimulationRunState(
  state: Partial<SimulationState>
): Promise<void> {
  const currentState = await getActiveSimulation();
  if (!currentState) {
    throw new Error('No scheduled simulation run state found');
  }

  // Validate state transition if status is being updated
  if (state.status) {
    SimulationStateMachine.validateTransition(currentState, state.status);
  }

  await database
    .collection('simulation_state')
    .updateOne(
      { _id: currentState._id },
      { $set: { ...state, updatedAt: new Date() } }
    );
}

export async function createScheduledSimulationRunState(
  state: Partial<SimulationState>
): Promise<void> {
  const currentState = await getActiveSimulation();
  if (currentState) {
    throw new Error('Scheduled simulation run state already exists');
  }

  // Ensure we're creating a new state with 'scheduled' status
  const newState: Partial<SimulationState> = {
    ...state,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'scheduled',
  };

  await database.collection('simulation_state').insertOne(newState);
}

export async function getSimulationHistory(
  limit = 10
): Promise<SimulationState[]> {
  return (await database
    .collection('simulation_state')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()) as SimulationState[];
}

export async function getLastCompletedSimulation(): Promise<SimulationState | null> {
  const result = await database
    .collection('simulation_state')
    .findOne({ status: 'completed' }, { sort: { completedAt: -1 } });
  return result as SimulationState | null;
}
