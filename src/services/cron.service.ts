import cron, { ScheduledTask } from 'node-cron';
import { TournamentStatusService } from './tournamentStatus.service';

let cronJob: ScheduledTask | null = null;

export class CronService {
  static startTournamentStatusUpdates(): void {
    // Run every minute to check tournament statuses
    cronJob = cron.schedule('* * * * *', async () => {
      console.log('Running tournament status update check...');
      await TournamentStatusService.updateTournamentStatuses();
    });

    console.log('Tournament status update cron job started (runs every minute)');
  }

  static stopTournamentStatusUpdates(): void {
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
    }
    console.log('Tournament status update cron job stopped');
  }
}
