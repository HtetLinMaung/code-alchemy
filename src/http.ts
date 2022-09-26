import axios, { AxiosRequestConfig } from "axios";

export default {
  get: async (url: string, config?: AxiosRequestConfig<any>) => {
    try {
      const response = await axios.get(url, config);
      return [response, null];
    } catch (err) {
      if ("response" in err) {
        return [err.response, null];
      }
      return [null, err];
    }
  },
  post: async (url: string, data?: any, config?: AxiosRequestConfig<any>) => {
    try {
      const response = await axios.post(url, data, config);
      return [response, null];
    } catch (err) {
      if ("response" in err) {
        return [err.response, null];
      }
      return [null, err];
    }
  },
  put: async (url: string, data?: any, config?: AxiosRequestConfig<any>) => {
    try {
      const response = await axios.put(url, data, config);
      return [response, null];
    } catch (err) {
      if ("response" in err) {
        return [err.response, null];
      }
      return [null, err];
    }
  },
  patch: async (url: string, data?: any, config?: AxiosRequestConfig<any>) => {
    try {
      const response = await axios.patch(url, data, config);
      return [response, null];
    } catch (err) {
      if ("response" in err) {
        return [err.response, null];
      }
      return [null, err];
    }
  },
  delete: async (url: string, config?: AxiosRequestConfig<any>) => {
    try {
      const response = await axios.delete(url, config);
      return [response, null];
    } catch (err) {
      if ("response" in err) {
        return [err.response, null];
      }
      return [null, err];
    }
  },
};
