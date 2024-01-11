import { Capacitor } from "@capacitor/core";
import { createContext, useContext, useEffect, useState } from "react";

import api from "@/api";
import LoadingOverlay from "@/components/basics/LoadingOverlay";
import Overlay from "@/components/basics/Overlay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useEffectOnce } from "@/utils/hacks";
import { useNetworkStatus } from "@/utils/network";
import { SimpleOAuthHandler } from "@/utils/oauth/handler";

import { login as androidLogin } from "./AuthProvider/android";
import { login as webLogin } from "./AuthProvider/web";

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  offlineMode: boolean;
  isOnline: boolean;
  isOffline: boolean;
  logOut: () => void;
};

export const platform = Capacitor.getPlatform();

const oauthHandler = new SimpleOAuthHandler(
  import.meta.env.VITE_DEV_AUTH_SERVER_URL!,
  import.meta.env.VITE_DEV_CLIENT_ID!,
  import.meta.env.VITE_DEV_API_ENDPOINT!,
  {
    login: platform === "android" ? androidLogin : webLogin,
  },
);

// install in api
oauthHandler.hookIntoAxios(api);

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(oauthHandler.accessTokenIsValid);
  const [hasRefreshToken, setHasRefreshToken] = useState(
    oauthHandler.refreshTokenIsValid,
  );

  const networkStatus = useNetworkStatus();
  const [offlineMode, setOfflineMode] = useState(false);

  const isOnline = !offlineMode && networkStatus === "online";
  const isOffline = !isOnline;

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onLogin = async () => {
    try {
      setIsLoading(true);
      await oauthHandler.login();
    } catch (error) {
      const localToast = toast({
        title: "Error logging in",
        variant: "destructive",
        description: String(error),
        action: (
          <Button
            variant="ghost"
            onClick={() => {
              onLogin();
              localToast.dismiss();
            }}
          >
            Retry
          </Button>
        ),
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const autoLogin = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Authentication",
        description: "Refreshing tokens...",
        duration: 2000,
      });
      await oauthHandler.refreshToken();
    } catch (error) {
      // quick toast to explain the delay
      const localToast = toast({
        title: "Error refreshing access",
        variant: "destructive",
        description: String(error),
        action: (
          <Button
            variant="ghost"
            onClick={() => {
              localToast.dismiss();
              onLogin();
            }}
          >
            Login
          </Button>
        ),
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onChange = () => {
      setIsLoggedIn(oauthHandler.accessTokenIsValid);
      setHasRefreshToken(oauthHandler.refreshTokenIsValid);
    };

    oauthHandler.addEventListener("change", onChange);
    return () => {
      oauthHandler.removeEventListener("change", onChange);
    };
  }, []);

  const autoRefreshSession = isOnline && !isLoggedIn && hasRefreshToken;
  useEffectOnce(() => {
    if (autoRefreshSession) setTimeout(autoLogin, 0); // Show the toast correctly
  }, [autoRefreshSession]);

  // customize
  const authContext: AuthContextType = {
    isLoggedIn,
    isLoading,
    offlineMode,
    isOnline,
    isOffline,
    logOut: () => {
      if (isLoggedIn) oauthHandler.revokeToken();
      setOfflineMode(false);
    },
  };

  //* Wait for network status to load
  if (!networkStatus || isLoading) return <LoadingOverlay className="h-10 w-10" />;
  if (!hasRefreshToken && !offlineMode)
    return (
      <Overlay>
        <div className="flex flex-col gap-y-2">
          <Button size="lg" onClick={onLogin} disabled={isOffline}>
            Login with Cognito
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setOfflineMode(true)}>
            Continue in offline mode
          </Button>
        </div>
      </Overlay>
    );
  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error("useAuth must be used within a AuthProvider");

  return context as AuthContextType;
}
export default AuthProvider;
