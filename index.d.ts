import { AzureFunction, Context, HttpRequest } from "@azure/functions";
export declare const responseAzureFuncError: (context: Context, err: any) => void;
interface CreateHook {
    beforeCreate?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterCreate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeResponse?: (defaultBody: any) => any;
}
export declare const brewAzureFuncCreate: (Model: any, hooks?: CreateHook, connector?: string) => AzureFunction;
interface FindHooks {
    beforeResponse?: (defaultBody: any) => any;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: any, context: Context, req: HttpRequest) => Promise<void> | void;
}
export declare const brewAzureFuncFindAll: (Model: any, hooks?: FindHooks, connector?: string, sequelize?: any, searchColumns?: string[]) => AzureFunction;
export declare const brewAzureFuncFindOne: (Model: any, hooks?: FindHooks, message?: string, connector?: string) => AzureFunction;
interface UpdateHooks {
    beforeResponse?: (defaultBody: any) => any;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeUpdate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterUpdate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: any, context: Context, req: HttpRequest) => Promise<void> | void;
}
export declare const brewAzureFuncUpdate: (Model: any, hooks?: UpdateHooks, message?: string, connector?: string) => AzureFunction;
interface DeleteHooks {
    beforeResponse?: (defaultBody: any) => any;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeDelete?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterDelete?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: any, context: Context, req: HttpRequest) => Promise<void> | void;
}
export declare const brewAzureFuncDelete: (Model: any, hooks?: DeleteHooks, message?: string, connector?: string) => AzureFunction;
export {};
