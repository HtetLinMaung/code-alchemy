import { DynamicObject } from "../interfaces";
declare const queryToWhere: (query: any, connector?: string, sequelize?: any, searchColumns?: string[]) => DynamicObject;
export default queryToWhere;
