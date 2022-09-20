import axios from "axios";

const log = async (data) => {
  try {
    await axios.post(`${process.env.log_server}/logs`, data);
  } catch (err) {
    console.error(err);
  }
};

export default log;
