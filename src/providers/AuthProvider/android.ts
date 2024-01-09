import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

import { getLoginURL, getToken } from "@/utils/oauth";
import { SimpleOAuthHandler } from "@/utils/oauth/handler";

const androidBaseURL = `${import.meta.env.VITE_ANDROID_SCHEME}://${
  import.meta.env.VITE_ANDROID_HOST
}`;

export const login = async (instance: SimpleOAuthHandler) => {
  const url = getLoginURL({
    serverURL: instance.serverURL,
    clientId: instance.clientId,
    redirectUri: `${androidBaseURL}/callback`,
    responseType: "code",
  });

  // wait for close event
  const code = await new Promise<string>((resolve, reject) => {
    (async () => {
      await Browser.open({ url });
      const urlOpenListener = await App.addListener("appUrlOpen", (e) => {
        urlOpenListener.remove();
        const url = new URL(e.url),
          code = url.searchParams.get("code");

        if (code) resolve(code);
        else reject(new Error("Login - No Authentication code received."));
      });

      const finishListener = await Browser.addListener(
        "browserFinished",
        () => {
          finishListener.remove();
          reject(new Error("Login - Authentication popup was closed."));
        },
      );
    })();
  });

  const tokens = await getToken({
    serverURL: instance.serverURL,
    clientId: instance.clientId,
    redirectUri: `${androidBaseURL}/callback`,
    grantType: "authorization_code",
    code,
  });

  return tokens;
};
