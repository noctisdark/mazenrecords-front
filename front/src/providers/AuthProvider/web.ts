import { getLoginURL, getToken } from "@/utils/oauth";
import { SimpleOAuthHandler } from "@/utils/oauth/handler";

// Don't use redirect uri

const webBaseURL = `${import.meta.env.VITE_DEV_ORIGIN}`;

export const login = async (instance: SimpleOAuthHandler) => {
  const url = getLoginURL({
    serverURL: instance.serverURL,
    clientId: instance.clientId,
    redirectUri: `${webBaseURL}/callback`,
    responseType: "code",
  });

  const code = await new Promise<string>((resolve, reject) => {
    const otherWindow = window.open(url, "_blank");
    if (!otherWindow)
      return reject(new Error("Login - Authentication popup was blocked"));

    // function hoisting is boss
    const removeEventListeners = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      window.removeEventListener("message", onMessage);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== import.meta.env.VITE_DEV_ORIGIN) return;
      if (e.data.source !== "/callback") return;

      removeEventListeners();
      if (e.data.code) resolve(e.data.code);
      else reject(new Error("Login - No Authentication code received."));
    };

    const checkClosed = () => {
      if (otherWindow!.closed) {
        reject(new Error("Login - Authentication popup was closed."));
        removeEventListeners();
      }
    };

    let intervalId: NodeJS.Timeout | null = setInterval(checkClosed, 1000);
    window.addEventListener("message", onMessage);
  });

  const tokens = await getToken({
    serverURL: instance.serverURL,
    clientId: instance.clientId,
    redirectUri: `${webBaseURL}/callback`,
    grantType: "authorization_code",
    code,
  });

  return tokens;
};
