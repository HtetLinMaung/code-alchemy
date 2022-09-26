"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_json_1 = __importDefault(require("./is-json"));
const queryToWhere = (query, connector = "sequelize", sequelize = null, searchColumns = []) => {
    let where = null;
    for (const [k, v] of Object.entries(query)) {
        if (k == "search") {
            if (connector == "sequelize" && sequelize) {
                where = {
                    [sequelize.Op.or]: searchColumns.map((column) => ({
                        [column]: {
                            [sequelize.Op.like]: `%${v}%`,
                        },
                    })),
                };
            }
            else if (connector == "mongoose") {
                where = {
                    $text: { $search: v },
                };
            }
        }
        else if (!["page", "perpage", "sort"].includes(k)) {
            if (!where) {
                where = {};
            }
            where[k] = (0, is_json_1.default)(v) ? JSON.parse(v) : v;
        }
    }
    return where;
};
exports.default = queryToWhere;
