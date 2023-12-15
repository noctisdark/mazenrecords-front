import api from ".";

export const login = ({ password }: { password: string }) =>
  api.post("/login", { password });
