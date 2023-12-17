import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";

const api = applyCaseMiddleware(axios.create({}), {
  ignoreHeaders: false,
});

export default api;
