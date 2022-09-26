"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = void 0;
const node_util_1 = __importDefault(require("node:util"));
exports.exec = node_util_1.default.promisify(require("node:child_process").exec);
