"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const stream = __importStar(require("stream"));
const util_1 = require("util");
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const finished = (0, util_1.promisify)(stream.finished);
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
    download: (src, dest) => __awaiter(void 0, void 0, void 0, function* () {
        const writer = fs_1.default.createWriteStream(dest);
        const response = yield (0, axios_1.default)({
            url: src,
            method: "get",
            responseType: "stream",
        });
        response.data.pipe(writer);
        return finished(writer);
    }),
};
