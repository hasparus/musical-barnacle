import * as toolbelt from "ts-toolbelt";

export { toolbelt };

export type AsyncReturnType<F extends (...args: any) => any> =
  toolbelt.Any.Await<ReturnType<F>>;
