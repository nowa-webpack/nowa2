export type Plugin<For> = {
  apply: (pluginable: For) => void | Promise<void>;
};
