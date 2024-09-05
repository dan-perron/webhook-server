export interface AIClient {
  cabinChat({ input }): Promise<string>;
  ootpChat({ turnInfo, input, powerRankings, reminders }): Promise<string>;
  politicsChat({ input }): Promise<string>;
  specialistChat({ input }): Promise<string>;
  sportsChat({ input, data }): Promise<string>;
  generatePowerRankings({ input, data }): Promise<string>;
  testChat({ input }): Promise<string>;
  genericChat({ input, reminders }): Promise<string>;
}
