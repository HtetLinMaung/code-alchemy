import { DynamicObject } from "../interfaces";
import isJson from "./is-json";

export const convertFilterOperator = (filter: any, sequelize: any) => {
  if (Array.isArray(filter)) {
    return filter;
  }
  const newFilter: any = {};
  for (const [k, v] of Object.entries(filter)) {
    let key = k;
    if (k.startsWith("$")) {
      key = sequelize.Op[k.replace("$", "")];
    }
    if (typeof v == "object" && !Array.isArray(v)) {
      newFilter[key] = convertFilterOperator(v, sequelize);
    } else {
      newFilter[key] = v;
    }
  }
  return newFilter;
};

const queryToWhere = (
  query: any,
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
) => {
  let where: DynamicObject = null;
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
      } else if (connector == "mongoose") {
        where = {
          $text: { $search: v },
        };
      }
    } else if (
      ![
        "page",
        "perpage",
        "sort",
        "select",
        "projection",
        "group",
        "search",
      ].includes(k)
    ) {
      if (!where) {
        where = {};
      }

      if (connector == "sequelize") {
        where[k] = isJson(v)
          ? convertFilterOperator(JSON.parse(v as any), sequelize)
          : v;
      } else {
        where[k] = isJson(v) ? JSON.parse(v as any) : v;
      }
    }
  }
  return where;
};

export default queryToWhere;
