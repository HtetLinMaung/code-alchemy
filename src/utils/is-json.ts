const isJson = (v) => {
  try {
    if (!v.startsWith("{") && !v.startsWith("[")) {
      return false;
    }
    JSON.parse(v);
    return true;
  } catch (err) {
    return false;
  }
};

export default isJson;
