import * as inquirer from 'inquirer';
import {
  adenToUpper,
  currentBranch,
  replaceLatestWithAdEngineVersion,
  requiredInput,
} from '../../utils/question-helpers';
import { sandboxes } from '../../utils/sandbox';
import { store } from '../../utils/store';
import { Job } from './job-questions';
import { availableProjects, Project } from './project-questions';

interface FilterParamQuestion extends inquirer.Question {
  name: keyof ParamsResult;
  destined: {
    jobs: Job[];
    projects: Project[];
    extended: boolean;
  };
}

export interface ParamsResult {
  branch?: string;
  adEngineVersion?: string;
  sandbox?: string;
  configBranch?: string;
  datacenter?: string;
  crowdinBranch?: string;
  debug?: boolean;
  testBranch?: string;
  query?: string;
  fandomEnvironment?: string;
  extension?: string;
  name?: string;
}

export function getParamQuestions(
  jobs: Job[],
  projects: Project[],
  extended: boolean,
): inquirer.Questions {
  return questions.filter(question => {
    const isJobOk = question.destined.jobs.some(job => jobs.includes(job));
    const isProjectOk = question.destined.projects.some(project => projects.includes(project));
    const isExtendedOk = !question.destined.extended || extended;

    return isJobOk && isProjectOk && isExtendedOk;
  });
}

const questions: FilterParamQuestion[] = [
  {
    name: 'branch',
    message: 'Project branch',
    validate: requiredInput,
    filter: adenToUpper,
    transformer: adenToUpper,
    default: currentBranch,
    destined: {
      jobs: ['update', 'deploy'],
      projects: availableProjects,
      extended: false,
    },
  },
  {
    name: 'adEngineVersion',
    message: 'Version of @wikia/ad-engine (can be "latest")',
    validate: requiredInput,
    filter: replaceLatestWithAdEngineVersion,
    default: (answers: ParamsResult) => answers.branch,
    destined: {
      jobs: ['update'],
      projects: availableProjects,
      extended: false,
    },
  },
  {
    name: 'sandbox',
    type: 'list',
    message: 'Sandbox',
    validate: requiredInput,
    choices: sandboxes,
    default: store.sandbox,
    destined: {
      jobs: ['deploy', 'test'],
      projects: availableProjects,
      extended: false,
    },
  },
  {
    name: 'configBranch',
    message: 'Config branch e.g. release-01, PLAT-345',
    destined: {
      jobs: ['update'],
      projects: ['app'],
      extended: true,
    },
  },
  {
    name: 'datacenter',
    message: 'Datacenter',
    validate: requiredInput,
    default: 'sjc',
    destined: {
      jobs: ['update'],
      projects: ['app', 'mobile-wiki'],
      extended: true,
    },
  },
  {
    name: 'crowdinBranch',
    message: 'Branch for Crowdin translations (leave empty if translations update not needed)',
    destined: {
      jobs: ['update'],
      projects: ['app', 'mobile-wiki'],
      extended: true,
    },
  },
  {
    name: 'debug',
    type: 'confirm',
    message: 'Branch for Crowdin translations (leave empty if translations update not needed)',
    default: false,
    destined: {
      jobs: ['update'],
      projects: ['app'],
      extended: true,
    },
  },
  {
    name: 'testBranch',
    message: 'Branch for Tests',
    destined: {
      jobs: ['test'],
      projects: availableProjects,
      extended: true,
    },
  },
  {
    name: 'query',
    message: 'Url params',
    default: `cb=${+new Date()}`,
    destined: {
      jobs: ['test'],
      projects: availableProjects,
      extended: false,
    },
  },
  {
    name: 'fandomEnvironment',
    message: 'Environment for Fandom ( Upstream) tests',
    default: 'sandbox-adeng',
    destined: {
      jobs: ['test'],
      projects: availableProjects,
      extended: true,
    },
  },
  {
    name: 'extension',
    message: 'Additional browser extenstions e.g. adblock',
    destined: {
      jobs: ['test'],
      projects: availableProjects,
      extended: true,
    },
  },
  {
    name: 'name',
    message: 'Custom name which will be added to tab name',
    validate: requiredInput,
    default: (answers: ParamsResult) => answers.branch || answers.sandbox,
    destined: {
      jobs: ['test'],
      projects: availableProjects,
      extended: false,
    },
  },
];