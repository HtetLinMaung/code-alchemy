"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressStreamMedia = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const mime_1 = __importDefault(require("mime"));
const expressStreamMedia = (filepath, req, res) => {
    const mimetype = mime_1.default.getType(filepath);
    const stat = node_fs_1.default.statSync(filepath);
    const range = req.headers.range;
    let readStream;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const partial_start = parts[0];
        const partial_end = parts[1];
        if ((isNaN(partial_start) && partial_start.length > 1) ||
            (isNaN(partial_end) && partial_end.length > 1)) {
            return res.sendStatus(500);
        }
        const start = parseInt(partial_start, 10);
        const end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
        const content_length = end - start + 1;
        res.status(206).header({
            "Content-Type": mimetype,
            "Content-Length": content_length,
            "Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
        });
        readStream = node_fs_1.default.createReadStream(filepath, { start, end });
    }
    else {
        res.header({
            "Content-Type": mimetype,
            "Content-Length": stat.size,
        });
        readStream = node_fs_1.default.createReadStream(filepath);
    }
    readStream.pipe(res);
};
exports.expressStreamMedia = expressStreamMedia;
