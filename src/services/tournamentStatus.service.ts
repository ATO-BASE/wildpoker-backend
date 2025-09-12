import { Tournament } from '../models/tournament.model';
import { addMinutes, addHours, isBefore } from 'date-fns';

export class TournamentStatusService {
  /**
   * Updates tournament statuses based on current time
   * This should be called periodically (e.g., every minute via cron job)
   */
  static async updateTournamentStatuses(): Promise<void> {
    try {
      const now = new Date();
      
      // Get all active tournaments
      const tournaments = await Tournament.findAll({
        where: {
          status: ['registering', 'running']
        }
      });

      for (const tournament of tournaments) {
        const startsAt = new Date(tournament.startsAt);
        const lateRegEndDate = addMinutes(startsAt, tournament.lateRegMin);
        const tournamentEndDate = addHours(startsAt, tournament.duration);

        let newStatus: 'registering' | 'running' | 'completed' | 'cancelled';

        if (isBefore(tournamentEndDate, now)) {
          // Tournament has ended
          newStatus = 'completed';
        } else if (isBefore(lateRegEndDate, now)) {
          // Late registration is over, tournament is running
          newStatus = 'running';
        } else if (isBefore(startsAt, now)) {
          // Tournament has started but late reg is still open
          newStatus = 'registering';
        } else {
          // Tournament hasn't started yet - keep as registering
          newStatus = 'registering';
        }

        // Only update if status has changed
        if (tournament.status !== newStatus) {
          await tournament.update({ status: newStatus });
          console.log(`Tournament ${tournament.id} (${tournament.name}) status updated: ${tournament.status} -> ${newStatus}`);
        }
      }
    } catch (error) {
      console.error('Error updating tournament statuses:', error);
    }
  }

  /**
   * Get tournament status for a specific tournament
   */
  static getTournamentStatus(tournament: Tournament, now: Date = new Date()): string {
    const startsAt = new Date(tournament.startsAt);
    const lateRegEndDate = addMinutes(startsAt, tournament.lateRegMin);
    const tournamentEndDate = addHours(startsAt, tournament.duration);

    if (isBefore(tournamentEndDate, now)) {
      return 'completed';
    } else if (isBefore(lateRegEndDate, now)) {
      return 'running';
    } else if (isBefore(startsAt, now)) {
      return 'registering';
    } else {
      return 'registering';
    }
  }
}
