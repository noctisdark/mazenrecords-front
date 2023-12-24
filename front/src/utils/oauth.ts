import api from "@/api";

// TODO: keep somewhat generic, but ngl this is essentially for logging into cognito user pools
// TODO: Decide if we should reimplement as a context

export type OAuthLoginRequest = {
  /**
   * The authentication server's URL
   */
  serverURL: string;
  /**
   * The URL where the authentication server redirects the browser after the authentication server authorizes the user.
   */
  redirectUri: string;
  /**
   * The value of client_id must be the ID of an app client in the user pool
   */
  clientId: string;
  /**
   * (Unintended use case)
   */
  clientSecret?: string;
  /**
   * When your app adds a state parameter to a request, the authentication server returns its value to your app when the /oauth2/authorize endpoint redirects your user.
   * * Automatically encoded to base64 and decoded in callback
   */
  state?: string;
  /**
   * (Unintended use case)
   * Can be a combination of any system-reserved scopes or custom scopes that are associated with a client. Scopes must be separated by spaces.<br/>
   *
   * System reserved scopes are :`openid`, `email`, `phone`, `profile`, `and aws.cognito.signin.user.admin`.
   *
   *
   * * Any scope used must be associated with the client, or it will be ignored at runtime.
   * * If the client doesn't request any scopes, the authentication server uses all scopes that are associated with the client.
   * * Concatenated using `+`
   */
  scopes?: string[];
  /**
   * The response type. Must be `code` or `token`.
   *
   * * `code` returns an authorization code grant. An authorization code grant is a code parameter that the authentication server appends to your redirect URL.
   *  Your app can exchange the code with the Token endpoint for access, ID, and refresh tokens. As a security best practice,
   *  and to receive refresh tokens for your users, use an authorization code grant in your app.
   * * (Unintended use case) `token` returns an implicit grant. An implicit grant is an ID and access token that the authentication server appends to your redirect URL.
   *  An implicit grant is less secure because it exposes tokens and potential identifying information to users.
   *  You can deactivate support for implicit grants in the configuration of your app client
   */
  responseType: "code" | "token";
};

export type OAuthTokenGrant =
  | {
      grantType: "authorization_code";
      /**
       * The redirection URI used when making the authentication request
       */
      redirectUri: string;
      /**
       * The code return by the authentication request
       */
      code: string;
      /**
       * (Unintended use case)
       * Required if grant_type is authorization_code and the authorization code was requested with PKCE.
       */
      codeVerifier?: string;
    }
  | {
      /**
       * To generate new access and ID tokens for a user's session
       */
      grantType: "refresh_token";
      refreshToken: string;
    }
  | {
      grantType: "client_credentials";
      /**
       * (Unintended use case)
       * Can be a combination of any system-reserved scopes or custom scopes that are associated with a client. Scopes must be separated by spaces.<br/>
       *
       * If the client doesn't request any scopes, the authentication server assigns all custom scopes that you've authorized in your app client configuration.
       *
       * * Any scope used must be associated with the client, or it will be ignored at runtime.
       * * If the client doesn't request any scopes, the authentication server uses all scopes that are associated with the client.
       * * Concatenated using `+`
       */
      scopes?: string[];
    };

export type OAuthTokenRequest = {
  /**
   * The authentication server's URL
   */
  serverURL: string;
  /**
   * Must be the same redirect_uri that was used to get authorization_code
   */
  clientId: string;
  /**
   * (Unintended use case)
   */
  clientSecret?: string;
} & OAuthTokenGrant;

export type OAuthRevokeRequest = {
  /**
   * The authentication server's URL
   */
  serverURL: string;
  /**
   * The app client ID for the
   */
  clientId: string;
  /**
   * The refresh token that the client wants to revoke. The request also revokes all access tokens that Amazon Cognito issued with this refresh token.
   */
  refreshToken: string;
};

export const getLoginURL = ({
  serverURL,
  responseType,
  clientId,
  redirectUri,
  state,
  scopes,
}: OAuthLoginRequest): string => {
  const url = new URL(serverURL);
  url.protocol = "https:"; // require https
  url.pathname = "/login";

  const params = new URLSearchParams();
  params.append("response_type", responseType);
  params.append("client_id", clientId);
  params.append("redirect_uri", redirectUri);

  if (state) params.append("state", btoa(state));

  if (scopes && scopes.length) params.append("scopes", scopes.join("+"));

  return `${url.href}?${params.toString()}`;
};

export const getToken = async (tokenRequest: OAuthTokenRequest) => {
  const { clientId, serverURL, grantType } = tokenRequest;
  const url = new URL(serverURL);
  url.protocol = "https:"; // require https
  url.pathname = "/oauth2/token";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", grantType);

  if (grantType === "authorization_code") {
    params.append("code", tokenRequest.code);
    params.append("redirect_uri", tokenRequest.redirectUri);

    if (tokenRequest.codeVerifier)
      throw new Error("Implemented flow for code_verifier");
  } else if (grantType === "refresh_token") {
    params.append("refresh_token", tokenRequest.refreshToken);
  } else {
    throw new Error(`Implemented flow for grant_type = ${grantType}`);
  }

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const response = await api.post(url.href, params, { headers }),
    tokens = response.data;

  return tokens;
};

export const revokeToken = async ({
  serverURL,
  clientId,
  refreshToken,
}: OAuthRevokeRequest) => {
  const url = new URL(serverURL);
  url.protocol = "https:"; // require https
  url.pathname = "/oauth2/revoke";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("token", refreshToken);

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const response = await api.post(url.href, params, { headers }),
    tokens = response.data;

  return tokens;
};
