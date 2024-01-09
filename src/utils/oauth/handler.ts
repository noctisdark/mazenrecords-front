import { Axios, isAxiosError } from "axios";

import { toCamelCase } from "@/utils/casing";
import { getToken, revokeToken } from "@/utils/oauth";
import { Optional } from "@/utils/types";

// Extend axios
declare module "axios" {
  export interface AxiosRequestConfig {
    authorization?: boolean;
    retried?: boolean;
  }
}

export type SessionToken = {
  /**
   * The type of token, which is always "Bearer" for OAuth 2.0.
   */
  tokenType: "Bearer";
  /**
   * The timestamp, in milliseconds since the Unix epoch, indicating when the access token becomes invalid.
   */
  expiresIn: number;
  /**
   * The access token used to authenticate and access the API.
   */
  accessToken: string;
  /**
   * The refresh token, a secret that allows the creation of new access tokens without user intervention.
   */
  refreshToken?: string;
};

export type SimpleOAuthHandlerConfig = {
  /**
   * Handle login
   */
  login: (instance: SimpleOAuthHandler) => Promise<SessionToken>;
  /**
   * Determine if access token was invalid
   */
  statusIsInvalidAccessToken: (status: number) => boolean;
  /**
   * Determine if refresh token was invalid
   */
  statusIsInvalidRefreshToken: (status: number) => boolean;
  /**
   * Whether or not to systematically refresh upon invalid access tokens
   */
  refreshOnInvalidAccessToken: boolean;
};

export type TokenChangeEvent = {
  tokens: SessionToken | null;
};

export class SimpleOAuthHandler extends EventTarget {
  private tokens: SessionToken | null;
  private options: SimpleOAuthHandlerConfig;

  constructor(
    public serverURL: string,
    public clientId: string,
    public protectedAPI: string,
    options: Optional<
      SimpleOAuthHandlerConfig,
      | "refreshOnInvalidAccessToken"
      | "statusIsInvalidAccessToken"
      | "statusIsInvalidRefreshToken"
    >,
  ) {
    super();
    // default options
    this.options = {
      login: options.login,
      statusIsInvalidAccessToken:
        options.statusIsInvalidAccessToken ?? ((status) => status === 401),
      statusIsInvalidRefreshToken:
        options.statusIsInvalidRefreshToken ??
        ((status) => status === 401 || status === 467 || status === 400),
      refreshOnInvalidAccessToken: options.refreshOnInvalidAccessToken ?? true,
    };

    this.tokens = this.restoreTokens();
  }

  get accessTokenIsValid() {
    return Boolean(
      this.tokens && this.tokens.expiresIn - +new Date() > this.expirationWindow,
    );
  }

  get refreshTokenIsValid() {
    return Boolean(this.tokens && this.tokens.refreshToken);
  }

  /**
   * Hook into an axios instance
   */

  hookIntoAxios(axios: Axios) {
    axios.interceptors.request.use(async (config) => {
      const isRequestToProtectedAPI =
        config.url?.startsWith(this.protectedAPI) ||
        (config.url?.startsWith("/") && config.baseURL === this.protectedAPI);

      if (!isRequestToProtectedAPI || config.authorization === false) return config;

      // Don't handle this error
      if (!this.accessTokenIsValid) await this.refreshToken();

      // Useless line, as refreshTokens will throw if failed
      if (!this.tokens)
        throw new Error("Unauthorized request: No tokens (unexpected behaviour)");

      config.headers.set(
        "Authorization ",
        `${this.tokens.tokenType} ${this.tokens.accessToken}`,
      );

      return config;
    });

    axios.interceptors.response.use(null, async (error) => {
      if (
        isAxiosError(error) &&
        error.config &&
        !error.config.retried &&
        this.options.statusIsInvalidAccessToken(error.response?.status ?? 0) &&
        this.options.refreshOnInvalidAccessToken
      ) {
        await this.refreshToken();
        error.config.retried = true;
        return axios.request(error.config);
      }
      return Promise.reject(error);
    });
  }

  /**
   * Login via OAuth 2 Protocol (Popup or Browser View)
   * *Revisit behaviour: clear tokens if fail
   */
  async login(force: boolean = false) {
    if (!force && this.accessTokenIsValid) return "LOGGED_IN";

    try {
      const newTokens = toCamelCase(await this.options.login(this));
      if (newTokens) this.storeTokens(this.concatTokens(newTokens, this.tokens));
    } catch (error) {
      this.clearTokens();
      throw error; // forward the error
    }
  }

  /**
   * Request a new access token
   * If a refresh token is present, it will be used to generate the new access token
   * Otherwise a new access token is requested (via login)
   */
  async refreshToken() {
    if (!this.refreshTokenIsValid) {
      // sometime we have to login
      await this.login();
    } else {
      // refresh token
      try {
        const newTokens: SessionToken = toCamelCase(
          await getToken({
            serverURL: this.serverURL,
            clientId: this.clientId,
            grantType: "refresh_token",
            refreshToken: this.tokens!.refreshToken!,
          }),
        );

        this.storeTokens(this.concatTokens(newTokens, this.tokens));
      } catch (error) {
        // refresh failed -> login
        if (
          isAxiosError(error) &&
          this.options.statusIsInvalidRefreshToken(error.response?.status! ?? 0)
        )
          return await this.login();

        throw error;
      }
    }
  }

  /**
   * Revoke the refresh token
   */
  async revokeToken() {
    if (!this.tokens?.refreshToken) {
      this.clearTokens();
      return;
    }

    try {
      await revokeToken({
        serverURL: this.serverURL,
        clientId: this.clientId,
        refreshToken: this.tokens.refreshToken,
      });

      this.clearTokens();
    } catch (error) {
      throw error;
    }
  }

  private storeTokens(tokens: SessionToken) {
    localStorage.setItem(`tokens@${this.serverURL}`, JSON.stringify(tokens));
    this.tokens = tokens;
    this.dispatchChange();
  }

  private restoreTokens(): SessionToken | null {
    const serializedTokens = localStorage.getItem(`tokens@${this.serverURL}`);
    this.tokens = serializedTokens ? JSON.parse(serializedTokens) : null;
    this.dispatchChange();
    return this.tokens;
  }

  private clearTokens() {
    this.tokens = null;
    localStorage.removeItem(`tokens@${this.serverURL}`);
    this.dispatchChange();
  }

  private concatTokens(
    newTokens: SessionToken,
    oldTokens: SessionToken | null = null,
  ): SessionToken {
    return {
      ...oldTokens,
      ...newTokens,
      expiresIn: +new Date() + (newTokens.expiresIn ?? 0) * 1000,
    };
  }

  private dispatchChange() {
    this.dispatchEvent(
      new Event("change", {
        bubbles: false,
        cancelable: false,
        composed: false,
      }),
    );
  }

  expirationWindow = 30000;
}
