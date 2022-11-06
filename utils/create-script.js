"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createScript(x = "") {
    return { run: () => eval(x) };
}
exports.default = createScript;
