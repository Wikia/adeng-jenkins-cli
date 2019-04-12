import chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as createJenkins from 'jenkins';
import * as MultiProgress from 'multi-progress';
import { combineLatest, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  getJobProgressEstimatedRemainingTime,
  getJobProgressPercentage,
  isJobDone,
  isJobProgress,
  JenkinsRxJs,
} from '../../jenkins-rxjs';
import { Jenkins } from '../../utils/jenkins';
import { millisecondsToDisplay } from '../../utils/milliseconds-to-display';
import { store } from '../../utils/store';
import { ensureAuthenticated } from '../login';
import { Job, verifyJobs } from './job-questions';
import { JobsBuilder } from './jobs-builder';
import { JobsRunner } from './jobs-runner/jobs-runner';
import { getParamQuestions, ParamsResult } from './param-questions';
import { Project, verifyProjects } from './project-questions';

export async function run(inputJobs: string[], inputProjects: string[], extended: boolean) {
  questionnaire(inputJobs, inputProjects, extended);
  // runJenkins();
}

async function questionnaire(inputJobs: string[], inputProjects: string[], extended: boolean) {
  const jobs: Job[] = await verifyJobs(inputJobs);
  const projects: Project[] = await verifyProjects(inputProjects);

  // TODO: Make so that instead of calling `getParamQuestions` one should call some kind of
  // inquirer.prompt which would return result with default values for questions not asked
  const paramQuestions = getParamQuestions(jobs, projects, extended);
  const result: ParamsResult = await inquirer.prompt<ParamsResult>(paramQuestions);

  console.log(result);

  const builder = new JobsBuilder();
  const builderResult = builder.build(jobs, projects, result);
  console.log(JSON.stringify(builderResult, null, 2));

  const jenkinsRxJs = await Jenkins.getJenkinsRxJs();
  const runner = new JobsRunner(jenkinsRxJs);

  await runner.runJobs(builderResult);
}

async function runJenkins() {
  const jenkinsRxJs = await Jenkins.getJenkinsRxJs();
  const opts = {
    name: 'update_dependencies_mobilewiki',
    parameters: { branch: 'jenkins-test', adengine_version: 'jenkins-test' },
  };

  const multi = new MultiProgress(process.stderr);
  const bar = multi.newBar('MobileWiki [:bar] :percent :remaining (:text)', {
    complete: chalk.green('='),
    incomplete: ' ',
    width: 30,
    total: 100,
  });

  combineLatest(jenkinsRxJs.job(opts), interval(500))
    .pipe(map(([response]) => response))
    .subscribe(response => {
      if (isJobProgress(response)) {
        bar.update(getJobProgressPercentage(response), {
          text: response.text,
          remaining: millisecondsToDisplay(getJobProgressEstimatedRemainingTime(response)),
        });
      } else if (isJobDone(response)) {
        if (response.status === 'SUCCESS') {
          bar.update(1, {
            text: chalk.green('Completed'),
            remaining: '',
          });
        } else {
          bar.update(1, {
            text: chalk.red('Failed'),
            remaining: '',
          });
        }
        // TODO: Should complete here
      }
    });
}
