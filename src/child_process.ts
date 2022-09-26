import util from "node:util";
export const exec = util.promisify(require("node:child_process").exec);
