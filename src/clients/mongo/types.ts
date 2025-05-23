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

export interface CommishCheckboxConfig {
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

export class CommishCheckboxes implements CommishCheckboxConfig {
  [key: string]: boolean | number | undefined;
  public backup_league_files: boolean;
  public retrieve_team_exports_from_server: boolean;
  public retrieve_team_exports_from_your_pc: boolean;
  public break_if_team_files_are_missing: boolean;
  public break_if_trades_are_pending: boolean;
  public demote_release_players_with_dfa_time_left_of_x_days_or_less: boolean;
  public auto_play_days: boolean;
  public create_and_upload_league_file: boolean;
  public create_and_upload_html_reports: boolean;
  public create_sql_dump_for_ms_access: boolean;
  public create_sql_dump_for_mysql: boolean;
  public export_data_to_csv_files: boolean;
  public upload_status_report_to_server: boolean;
  public create_and_send_result_emails: boolean;
  public dfa_days_value?: number;
  public auto_play_days_value?: number;

  constructor(options: Partial<CommishCheckboxConfig> = {}) {
    this.backup_league_files = options.backup_league_files ?? true;
    this.retrieve_team_exports_from_server =
      options.retrieve_team_exports_from_server ?? true;
    this.retrieve_team_exports_from_your_pc =
      options.retrieve_team_exports_from_your_pc ?? false;
    this.break_if_team_files_are_missing =
      options.break_if_team_files_are_missing ?? true;
    this.break_if_trades_are_pending =
      options.break_if_trades_are_pending ?? true;
    this.demote_release_players_with_dfa_time_left_of_x_days_or_less =
      options.demote_release_players_with_dfa_time_left_of_x_days_or_less ??
      false;
    this.auto_play_days = options.auto_play_days ?? true;
    this.create_and_upload_league_file =
      options.create_and_upload_league_file ?? true;
    this.create_and_upload_html_reports =
      options.create_and_upload_html_reports ?? true;
    this.create_sql_dump_for_ms_access =
      options.create_sql_dump_for_ms_access ?? false;
    this.create_sql_dump_for_mysql = options.create_sql_dump_for_mysql ?? false;
    this.export_data_to_csv_files = options.export_data_to_csv_files ?? false;
    this.upload_status_report_to_server =
      options.upload_status_report_to_server ?? true;
    this.create_and_send_result_emails =
      options.create_and_send_result_emails ?? true;
    this.dfa_days_value = options.dfa_days_value ?? null;
    this.auto_play_days_value = options.auto_play_days_value ?? null;
  }
}

export class SimulationOptions {
  public backupLeagueFolder: boolean;
  public manualImportTeams: boolean;
  public dryRun: boolean;
  public commishCheckboxes: CommishCheckboxes;

  constructor(
    options: Partial<{
      backupLeagueFolder: boolean;
      manualImportTeams: boolean;
      dryRun: boolean;
      commishCheckboxes: CommishCheckboxes;
    }> = {}
  ) {
    this.backupLeagueFolder = options.backupLeagueFolder ?? true;
    this.manualImportTeams = options.manualImportTeams ?? false;
    this.dryRun = options.dryRun ?? false;
    this.commishCheckboxes =
      options.commishCheckboxes ?? new CommishCheckboxes();
  }
}

export class OOTPSim {
  public id?: ObjectId;
  public fileSize?: number;
  public error?: string;

  constructor(public date: Date) {}
}
