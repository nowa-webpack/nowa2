import chalk from 'chalk';
import { ISolution } from '../SolutionConfiguration';

export default (coreVersion: string, cliVersion: string, solution: ISolution) => chalk`{magenta    _  ______ _      _____
  / |/ / __ \\ | /| / / _ |\tcore @ {cyan ${coreVersion}}
 /    / /_/ / |/ |/ / __ |\tcli @ {cyan ${cliVersion}}
/_/|_/\\____/|__/|__/_/ |_|\t${solution.name} @ {cyan ${solution.version}}}
`;
