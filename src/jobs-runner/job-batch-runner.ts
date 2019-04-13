import * as ansiEscapes from 'ansi-escapes';
import * as boxen from 'boxen';
import { BorderStyle } from 'boxen';
import chalk from 'chalk';
import * as MultiProgress from 'multi-progress';
import { JenkinsRxJs, JobDone } from '../jenkins-rxjs';
import { JobRunner } from './job-runner';
import { JobBatchDescriber, JobDescriber } from './models';

export class JobBatchRunner {
  private jobRunner: JobRunner;

  constructor(jenkins: JenkinsRxJs) {
    this.jobRunner = new JobRunner(jenkins);
  }

  async runJobs(inputs: JobBatchDescriber[]): Promise<void> {
    for (const input of inputs) {
      console.log(
        boxen(input.displayName, {
          padding: { left: 1, right: 1, bottom: 0, top: 0 },
          borderStyle: BorderStyle.Round,
        }),
      );
      process.stdout.write(ansiEscapes.cursorSavePosition);
      process.stdout.write(ansiEscapes.cursorHide);

      const multi = new MultiProgress(process.stderr);
      const results: JobDone[] = await Promise.all(this.runJobProjects(input, multi));
      multi.terminate();

      process.stdout.write(ansiEscapes.cursorRestorePosition);
      process.stdout.write(ansiEscapes.cursorDown(results.length) + ansiEscapes.cursorLeft);
      process.stdout.write(ansiEscapes.cursorShow);

      this.ensureSuccess(results);
    }
  }

  private ensureSuccess(results: JobDone[]): void {
    const failures = results.filter((result: JobDone) => result.status === 'FAILURE');

    if (failures.length) {
      console.log(chalk.red('Error: '), 'One or more jobs has failed with message:');
      failures.forEach((failure: JobDone) => console.log(`- ${failure.text}`));
      process.exit(1);
    }
  }

  private runJobProjects(input: JobBatchDescriber, multi: MultiProgress): Promise<JobDone>[] {
    return input.builds.map((build: JobDescriber) => this.jobRunner.run(build, multi));
  }
}