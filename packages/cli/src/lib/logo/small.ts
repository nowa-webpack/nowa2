import chalk from 'chalk';

export default (coreVersion: string, cliVersion: string) => chalk`{magenta    _  ______ _      _____
  / |/ / __ \\ | /| / / _ |
 /    / /_/ / |/ |/ / __ |\tcore @ {cyan ${coreVersion}}
/_/|_/\\____/|__/|__/_/ |_|\t cli @ {cyan ${cliVersion}}}
`;
