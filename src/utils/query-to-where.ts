import { DynamicObject } from "../interfaces";
import isJson from "./is-json";

const queryToWhere = (
  query: any,
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
) => {
  let where: DynamicObject = null;
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
      } else if (connector == "mongoose") {
        where = {
          $text: { $search: v },
        };
      }
    } else if (
      !["page", "perpage", "sort", "select", "projection"].includes(k)
    ) {
      if (!where) {
        where = {};
      }

      where[k] = isJson(v) ? JSON.parse(v as any) : v;
    }
  }
  return where;
};

export default queryToWhere;
