"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isJson = (v) => {
    try {
        if (!v.startsWith("{") && !v.startsWith("[")) {
            return false;
        }
        JSON.parse(v);
        return true;
    }
    catch (err) {
        return false;
    }
};
exports.default = isJson;
