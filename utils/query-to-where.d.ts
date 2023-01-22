import { DynamicObject } from "../interfaces";
export declare const convertFilterOperator: (filter: any, sequelize: any) => any;
declare const queryToWhere: (query: any, connector?: string, sequelize?: any, searchColumns?: string[]) => DynamicObject;
export default queryToWhere;
