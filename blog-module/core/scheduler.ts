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

  async runCron() {
    console.log('Running AI Blog Cron...');
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay();

    for (const schedule of this.config.scheduling.schedules) {
      // Very simple cron parsing for demonstration
      // In a real app, we'd use a library like 'cron-parser'
      // For now, we'll just check if the schedule matches some basic criteria
      // OR we just trigger them all and let the generator handle dedup via memory/storage

      // Basic check: parse hour from cron "m h ..."
      const parts = schedule.cron.split(' ');
      const hourStr = parts[1];

      if (hourStr !== '*' && parseInt(hourStr) !== now.getUTCHours()) {
        console.log(`Skipping schedule ${schedule.name} - not the right hour (${hourStr} vs ${now.getUTCHours()})`);
        continue;
      }

      console.log(`Checking schedule: ${schedule.name}`);

      // AUTO mode logic
      let typologyToRun = schedule.typology as string;
      if (typologyToRun === 'AUTO') {
        const availableTypologies = this.config.blog.typologyDefinitions?.map(d => d.id) || ['news', 'guide', 'tutorial'];
        const memory = await this.generator.getStorage().getMemory(); // Assuming access
        typologyToRun = await this.director.decideNextTypology(availableTypologies, memory);
      }

      try {
        await this.generator.generate(typologyToRun, {
          seoLevel: schedule.seoLevel,
          researchMode: schedule.researchMode,
        });
        console.log(`Successfully generated article for: ${schedule.name} (${typologyToRun})`);
      } catch (error) {
        console.error(`Failed to generate article for: ${schedule.name}`, error);
      }
    }
  }

  private selectAutoTypology(): any {
    const typologies = ['news', 'guide', 'tutorial', 'deep_dive'];
    return typologies[Math.floor(Math.random() * typologies.length)];
  }
}
