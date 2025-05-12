import config from 'config';
import { MongoClient, ObjectId } from 'mongodb';

// Replace the uri string with your connection string.
const uri = config.get('mongodb.connectionString');

const client = new MongoClient(uri);
const database = client.db('webhook-server');

export async function insertTokens(tokens) {
  const tokenCollection = database.collection('yahooFantasyTokens');
  return tokenCollection.insertOne({ date: new Date(), ...tokens });
}

export async function getLatestTokens() {
  const tokenCollection = database.collection('yahooFantasyTokens');
  const documents = await tokenCollection
    .find({})
    .sort({ date: -1 })
    .limit(1)
    .toArray();
  return documents.pop();
}

export async function insertReminder(type, reminder) {
  const reminderCollection = database.collection('reminders');
  return reminderCollection.insertOne({
    date: new Date(),
    active: true,
    type,
    reminder,
  });
}

export async function getRemindersAsText(filter) {
  const reminderCollection = database.collection('reminders');
  const reminders = await reminderCollection
    .find({ active: true, ...filter })
    .sort({ date: 1 })
    .toArray();
  return reminders.map((r) => r.reminder.text).join('\n');
}

export async function markRemindersDone(filter) {
  const reminderCollection = database.collection('reminders');
  return await reminderCollection.updateMany(
    { active: true, ...filter },
    { $set: { active: false } }
  );
}

export class OOTPSim {
  public id?: ObjectId;
  public fileSize?: number;
  public error?: string;

  constructor(public date: Date) {}
}

export async function recordOOTPSim(sim: OOTPSim): Promise<OOTPSim> {
  const simCollection = database.collection('ootpSims');
  const val = await simCollection.insertOne(sim);
  sim.id = val.insertedId;
  return sim
}

export async function getLastOOTPSim(): Promise<OOTPSim|null> {
  const simCollection = database.collection<OOTPSim>('ootpSims');
  const sims = await simCollection
    .find({ error: { $exists: false } })
    .sort({ date: -1 })
    .limit(1)
    .toArray();
  if (!sims) {
    return null;
  }
  return sims[0];
}

export async function updateOOTPSim(sim: OOTPSim) {
  if (!sim.id) {
    return;
  }
  const simCollection = database.collection<OOTPSim>('ootpSims');
  const query = { _id: new ObjectId(sim.id) };
  await simCollection.updateOne(query, { $set: sim });
}

interface SimulationPause {
  userId: string;
  pausedAt: Date;
  resumedAt?: Date;
}

interface SimulationState {
  _id?: ObjectId;
  lastScheduledRun: Date | null;
  skippedRun: boolean;
  createdAt: Date;
  completedAt?: Date;
  status: 'scheduled' | 'skipped' | 'completed' | 'failed';
  reason?: string;
  triggeredBy?: string;
  options?: {
    backupLeagueFolder?: boolean;
    manualImportTeams?: boolean;
    commishCheckboxes?: {
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
    };
  };
}

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
    pausedAt: new Date()
  };

  await database
    .collection('simulation_pauses')
    .insertOne(pause);
}

export async function resumeSimulationPause(userId: string): Promise<boolean> {
  const result = await database
    .collection('simulation_pauses')
    .updateOne(
      { userId, resumedAt: { $exists: false } },
      { $set: { resumedAt: new Date() } }
    );
  return result.modifiedCount > 0;
}

export async function resumeAllSimulationPauses(): Promise<number> {
  const result = await database
    .collection('simulation_pauses')
    .updateMany(
      { resumedAt: { $exists: false } },
      { $set: { resumedAt: new Date() } }
    );
  return result.modifiedCount;
}

export async function getSimulationRunState(): Promise<SimulationState> {
  const result = await database
    .collection('simulation_state')
    .findOne(
      { completedAt: { $exists: false } },
      { sort: { createdAt: -1 } }
    );
  return (result as unknown as SimulationState) || { 
    lastScheduledRun: null, 
    skippedRun: false,
    status: 'scheduled',
    createdAt: new Date()
  };
}

export async function updateSimulationRunState(state: Partial<SimulationState>): Promise<void> {
  const currentState = await getSimulationRunState();
  if (currentState._id) {
    // Update existing record
    await database
      .collection('simulation_state')
      .updateOne(
        { _id: currentState._id },
        { $set: { ...state, updatedAt: new Date() } }
      );
  } else {
    // Create new record
    await database
      .collection('simulation_state')
      .insertOne({
        ...state,
        createdAt: new Date(),
        status: 'scheduled'
      });
  }
}

export async function getSimulationHistory(limit = 10): Promise<SimulationState[]> {
  return await database
    .collection('simulation_state')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray() as unknown as SimulationState[];
}
