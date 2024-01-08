import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_DEV_API_ENDPOINT,
});

export default api;
