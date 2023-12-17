import { Capacitor } from "@capacitor/core";
import { createContext, useContext, useEffect, useState } from "react";

import LoadingOverlay from "@/components/basics/LoadingOverlay";
import Overlay from "@/components/basics/Overlay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useEffectOnce } from "@/utils/hacks";
import { SimpleOAuthHandler } from "@/utils/oauth/handler";

import { login as androidLogin } from "./AuthProvider/android";
import { login as webLogin } from "./AuthProvider/web";

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
};

export const platform = Capacitor.getPlatform();

const oauthHandler = new SimpleOAuthHandler(
  "https://visits.auth.eu-west-3.amazoncognito.com",
  "5o1sqp969ct6sqhv70bvkro0fj",
  "https://wy4lkquvlb.execute-api.eu-west-3.amazonaws.com",
  {
    login: platform === "android" ? androidLogin : webLogin,
  },
);

(window as any).authHandler = oauthHandler;

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(oauthHandler.accessTokenIsValid);
  const [hasRefreshToken, setHasRefreshToken] = useState(
    oauthHandler.refreshTokenIsValid,
  );
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
    const onChange = (e) => {
      setIsLoggedIn(oauthHandler.accessTokenIsValid);
      setHasRefreshToken(oauthHandler.refreshTokenIsValid);
    };

    oauthHandler.addEventListener("change", onChange);
    return () => {
      oauthHandler.removeEventListener("change", onChange);
    };
  }, []);

  const autoRefreshSession = !isLoggedIn && hasRefreshToken;
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
  };

  if (isLoading) return <LoadingOverlay className="h-10 w-10" />;
  if (!isLoggedIn)
    return (
      <Overlay>
        <Button size="lg" onClick={onLogin}>
          Login with Cognito
        </Button>
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
