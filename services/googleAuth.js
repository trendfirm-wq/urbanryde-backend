import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(onSuccess) {
  const [request, response, promptAsync] =
    Google.useAuthRequest({
      expoClientId:
        "618201056228-nn2vu59bvflvn88jk3grohb9qmaqjpr6.apps.googleusercontent.com",
    });

  useEffect(() => {
    if (response?.type === "success") {
      onSuccess(response.authentication);
    }
  }, [response]);

  return {
    request,
    promptAsync,
  };
}