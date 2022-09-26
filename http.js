"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
exports.default = {
    get: (url, config) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(url, config);
            return [response, null];
        }
        catch (err) {
            if ("response" in err) {
                return [err.response, null];
            }
            return [null, err];
        }
    }),
    post: (url, data, config) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(url, data, config);
            return [response, null];
        }
        catch (err) {
            if ("response" in err) {
                return [err.response, null];
            }
            return [null, err];
        }
    }),
    put: (url, data, config) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.put(url, data, config);
            return [response, null];
        }
        catch (err) {
            if ("response" in err) {
                return [err.response, null];
            }
            return [null, err];
        }
    }),
    patch: (url, data, config) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.patch(url, data, config);
            return [response, null];
        }
        catch (err) {
            if ("response" in err) {
                return [err.response, null];
            }
            return [null, err];
        }
    }),
    delete: (url, config) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.delete(url, config);
            return [response, null];
        }
        catch (err) {
            if ("response" in err) {
                return [err.response, null];
            }
            return [null, err];
        }
    }),
};
