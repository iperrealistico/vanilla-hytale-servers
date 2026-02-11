import { Director } from './director';
import { AiBlogConfig } from '../config/schema';
import { Generator } from './generator';

export class Scheduler {
  private config: AiBlogConfig;
  private generator: Generator;
  private director: Director;

  constructor(config: AiBlogConfig, generator: Generator, director: Director) {
    this.config = config;
    this.generator = generator;
    this.director = director;
  }

  async runCron(): Promise<string[]> {
    console.log('Running AI Blog Cron...');
    const now = new Date();
    const completedOneShots: string[] = [];

    for (const schedule of this.config.scheduling.schedules) {
      if (schedule.enabled === false) {
        console.log(`Skipping disabled schedule: ${schedule.name}`);
        continue;
      }

      // ... existing cron parsing logic ...
      const parts = schedule.cron.split(' ');
      const hourStr = parts[1];

      if (hourStr !== '*' && parseInt(hourStr) !== now.getUTCHours()) {
        continue;
      }

      console.log(`Executing schedule: ${schedule.name}`);

      // ... existing generation logic ...
      try {
        let typologyToRun = schedule.typology as string;
        if (typologyToRun === 'AUTO') {
          const availableTypologies = this.config.blog.typologyDefinitions?.map(d => d.id) || ['news', 'guide'];
          const memory = await this.generator.getStorage().getMemory();
          typologyToRun = await this.director.decideNextTypology(availableTypologies, memory);
        }

        await this.generator.generate(typologyToRun, {
          seoLevel: schedule.seoLevel,
          researchMode: schedule.researchMode,
        });

        if ((schedule as any).oneShot) {
          completedOneShots.push((schedule as any).id);
        }
      } catch (error) {
        console.error(`Failed: ${schedule.name}`, error);
      }
    }
    return completedOneShots;
  }

  private selectAutoTypology(): any {
    const typologies = ['news', 'guide', 'tutorial', 'deep_dive'];
    return typologies[Math.floor(Math.random() * typologies.length)];
  }
}
