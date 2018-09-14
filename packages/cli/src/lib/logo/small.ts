import chalk from 'chalk';

export default (coreVersion: string, cliVersion: string) => chalk`{magenta    _  ______ _      _____
  / |/ / __ \\ | /| / / _ |\tcore @ {cyan ${coreVersion}}
 /    / /_/ / |/ |/ / __ |\tcli @ {cyan ${cliVersion}}
/_/|_/\\____/|__/|__/_/ |_|\t
`;
