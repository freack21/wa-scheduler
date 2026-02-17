
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import JsonDB from '../models/JsonDB.js';
import waService from './WaService.js';

class SchedulerService {
    constructor() {
        this.db = new JsonDB(path.join(process.cwd(), 'data', 'schedulers.json'), { schedules: [] });
        this.interval = null;
    }

    start() {
        if (this.interval) return;
        console.log('Scheduler Service Started');
        this.interval = setInterval(() => this.checkSchedules(), 60000); // Check every minute
        this.checkSchedules(); // Check immediately on start
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    async createSchedule(userId, number, message, time) {
        const schedule = {
            id: uuidv4(),
            userId,
            number,
            message,
            time: new Date(time).toISOString(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        await this.db.push('schedules', schedule);
        return schedule;
    }

    async getSchedules(userId) {
        const data = await this.db.read();
        return data.schedules.filter(s => s.userId === userId);
    }

    async deleteSchedule(userId, id) {
        return await this.db.remove('schedules', { id, userId });
    }

    async checkSchedules() {
        const data = await this.db.read();
        const now = moment().tz("Asia/Jakarta");
        const schedules = data.schedules || [];
        
        // Filter schedules where time is due (compare as ISO strings or moment objects)
        const pendingSchedules = schedules.filter(s => {
            if (s.status !== 'pending') return false;
            const scheduleTime = moment(s.time).tz("Asia/Jakarta");
            return scheduleTime.isSameOrBefore(now);
        });

        for (const schedule of pendingSchedules) {
            try {
                console.log(`Executing schedule ${schedule.id} for user ${schedule.userId} at ${now.format()}`);
                 await waService.sendMessage(schedule.userId, schedule.number, schedule.message);
                
                // Update status to sent
                await this.db.update('schedules', { id: schedule.id }, { status: 'sent', executedAt: now.toISOString() });
            } catch (error) {
                console.error(`Failed to execute schedule ${schedule.id}:`, error.message);
                // Update status to failed
                await this.db.update('schedules', { id: schedule.id }, { status: 'failed', error: error.message });
            }
        }
    }
}

const schedulerService = new SchedulerService();
schedulerService.start();

export default schedulerService;
