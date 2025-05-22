import type {
  SimulationState,
  SimulationStatus,
} from '../clients/mongo/types.js';

interface StateTransition {
  from: SimulationStatus;
  to: SimulationStatus;
  condition?: (currentState: SimulationState) => boolean;
}

export class SimulationStateMachine {
  private static readonly VALID_TRANSITIONS: StateTransition[] = [
    { from: 'scheduled', to: 'started' },
    { from: 'scheduled', to: 'skipped' },
    { from: 'started', to: 'completed' },
    { from: 'started', to: 'failed' },
    { from: 'started', to: 'dry_run' },
  ];

  private static readonly TERMINAL_STATES: SimulationStatus[] = [
    'completed',
    'failed',
    'skipped',
    'dry_run',
  ];

  static canTransition(from: SimulationStatus, to: SimulationStatus): boolean {
    return this.VALID_TRANSITIONS.some(
      (transition) => transition.from === from && transition.to === to
    );
  }

  static validateTransition(
    currentState: SimulationState,
    newStatus: SimulationStatus
  ): void {
    if (!currentState.status) {
      throw new Error('Current state must have a status');
    }

    if (this.TERMINAL_STATES.includes(currentState.status)) {
      throw new Error(
        `Cannot transition from terminal state: ${currentState.status}`
      );
    }

    if (!this.canTransition(currentState.status, newStatus)) {
      throw new Error(
        `Invalid transition from ${currentState.status} to ${newStatus}`
      );
    }
  }

  static isTerminalState(status: SimulationStatus): boolean {
    return this.TERMINAL_STATES.includes(status);
  }
}
