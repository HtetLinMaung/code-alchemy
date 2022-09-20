import { isAsyncFunction } from "util/types";

const asyncEach = async (
  items: any[],
  cb = (item: any, index: number): any => {}
) => {
  const promises: Promise<any>[] = [];
  let i = 0;
  for (const item of items) {
    if (isAsyncFunction(cb)) {
      promises.push(cb(item, i));
    } else {
      cb(item, i);
    }
    i++;
  }
  if (promises.length) {
    await Promise.all(promises);
  }
};

export default asyncEach;
