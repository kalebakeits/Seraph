import { appParametersRepository } from '../drizzle/repositories/appParametersRepository';

export type AlarmMode = 'single' | 'schedule' | 'disabled';

export async function getAlarmTime(): Promise<string | null> {
  return appParametersRepository.get('alarm_time');
}

export async function setAlarmTime(time: string): Promise<void> {
  await appParametersRepository.set('alarm_time', time);
}

export async function getAlarmMode(): Promise<AlarmMode> {
  const mode = await appParametersRepository.get('alarm_mode');
  return (mode as AlarmMode | null) ?? 'disabled';
}

export async function setAlarmMode(mode: AlarmMode): Promise<void> {
  await appParametersRepository.set('alarm_mode', mode);
}

export async function getAlarmSingleTs(): Promise<number | null> {
  return appParametersRepository.getNumeric('alarm_single_ts');
}

export async function setAlarmSingleTs(unixSec: number): Promise<void> {
  await appParametersRepository.set('alarm_single_ts', unixSec);
}

export async function getAlarmSchedule(): Promise<number[]> {
  const schedule = await appParametersRepository.get('alarm_schedule');
  if (!schedule) return [0, 0, 0, 0, 0, 0, 0];
  try {
    return JSON.parse(schedule) as number[];
  } catch {
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

export async function setAlarmSchedule(schedule: number[]): Promise<void> {
  await appParametersRepository.set('alarm_schedule', JSON.stringify(schedule));
}
