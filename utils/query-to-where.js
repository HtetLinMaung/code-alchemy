"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFilterOperator = void 0;
const is_json_1 = __importDefault(require("./is-json"));
const convertFilterOperator = (filter, sequelize = null) => {
    const newFilter = {};
    for (const [k, v] of Object.entries(filter)) {
        let key = k;
        if (k.startsWith("$")) {
            key = sequelize.Op[k.replace("$", "")];
        }
        if (typeof v == "object" && !Array.isArray(v)) {
            newFilter[key] = (0, exports.convertFilterOperator)(v);
        }
        else {
            newFilter[key] = v;
        }
    }
    return newFilter;
};
exports.convertFilterOperator = convertFilterOperator;
const queryToWhere = (query, connector = "sequelize", sequelize = null, searchColumns = []) => {
    let where = null;
    for (const [k, v] of Object.entries(query)) {
        if (k == "search" && v) {
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
        else if (![
            "page",
            "perpage",
            "sort",
            "select",
            "projection",
            "group",
            "search",
        ].includes(k)) {
            if (!where) {
                where = {};
            }
            if (connector == "sequelize") {
                where[k] = (0, is_json_1.default)(v) ? (0, exports.convertFilterOperator)(JSON.parse(v)) : v;
            }
            else {
                where[k] = (0, is_json_1.default)(v) ? JSON.parse(v) : v;
            }
        }
    }
    return where;
};
exports.default = queryToWhere;
