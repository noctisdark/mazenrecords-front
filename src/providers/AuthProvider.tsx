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
  isOffline: boolean;
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

  const [networkStatus, forceOffline, offlineMode] = useNetworkStatus();
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

  const refreshAccess = async () => {
    try {
      setIsLoading(true);
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

  const autoRefreshSession =
    !isLoggedIn && hasRefreshToken && networkStatus === "online";

  useEffectOnce(() => {
    if (autoRefreshSession) {
      setTimeout(() => {
        toast({
          title: "Authentication",
          description: "Refreshing tokens...",
          duration: 2000,
        });
      }, 0);

      refreshAccess();
    }
  }, [autoRefreshSession]);

  // customize
  const authContext: AuthContextType = {
    isLoggedIn,
    isLoading,
    offlineMode,
    isOffline: networkStatus === "offline",
  };

  if (isLoading) return <LoadingOverlay className="h-10 w-10" />;
  if (!offlineMode && !isLoggedIn)
    return (
      <Overlay>
        <div className="flex flex-col gap-y-2">
          <Button size="lg" onClick={onLogin}>
            Login with Cognito
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => forceOffline(true)}
          >
            Continue in offline mode
          </Button>
        </div>
      </Overlay>
    );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error("useAuth must be used within a AuthProvider");

  return context as AuthContextType;
}
export default AuthProvider;
