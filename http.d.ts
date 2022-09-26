import { AxiosRequestConfig } from "axios";
declare const _default: {
    get: (url: string, config?: AxiosRequestConfig<any>) => Promise<any[]>;
    post: (url: string, data?: any, config?: AxiosRequestConfig<any>) => Promise<any[]>;
    put: (url: string, data?: any, config?: AxiosRequestConfig<any>) => Promise<any[]>;
    patch: (url: string, data?: any, config?: AxiosRequestConfig<any>) => Promise<any[]>;
    delete: (url: string, config?: AxiosRequestConfig<any>) => Promise<any[]>;
};
export default _default;
