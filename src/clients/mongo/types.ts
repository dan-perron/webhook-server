import { ObjectId } from 'mongodb';

export interface SimulationPause {
  userId: string;
  pausedAt: Date;
  resumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimulationState {
  _id?: ObjectId;
  scheduledFor: Date | null;
  skippedRun: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  status: SimulationStatus;
  reason?: string;
  triggeredBy?: string;
  options?: SimulationOptions;
  remindersSent?: {
    twentyFourHours?: boolean;
    twelveHours?: boolean;
  };
}

export type SimulationStatus =
  | 'scheduled'
  | 'skipped'
  | 'completed'
  | 'failed'
  | 'dry_run'
  | 'started';

export interface SimulationOptions {
  backupLeagueFolder?: boolean;
  manualImportTeams?: boolean;
  commishCheckboxes?: CommishCheckboxes;
  dryRun?: boolean;
}

export interface CommishCheckboxes {
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

export class OOTPSim {
  public id?: ObjectId;
  public fileSize?: number;
  public error?: string;

  constructor(public date: Date) {}
}
