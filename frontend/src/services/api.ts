import { hc } from "hono/client";
// Import AppType directly from the backend package
// This avoids a circular dependency via the 'shared' package
import type { AppType } from "@my-app/backend";

// Use a relative path for the API URL
// This allows the Vite proxy to catch requests (e.g., /api/user/me)
const apiUrl = "/";

// Create the hono client and let TypeScript infer its type
const client = hc<AppType>(apiUrl);

// Get the inferred type of the client
type HonoClientType = typeof client;

// Create a proxied client that automatically adds the Auth token
export const api = new Proxy(client as any, {
  get(target, prop) {
    // Check if the property is one of the $ methods (e.g., $get, $post)
    if (typeof prop === "string" && prop.startsWith("$")) {
      const originalMethod = target[prop as keyof typeof target];

      return async (...args: any[]) => {
        const { useAuthStore } = await import("@/stores/auth");

        const authStore = useAuthStore();
        const token = authStore.session?.access_token;

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Add headers to the request options (which is the last argument)
        const lastArg = args[args.length - 1];
        if (
          typeof lastArg === "object" &&
          lastArg !== null &&
          !Array.isArray(lastArg)
        ) {
          lastArg.headers = { ...lastArg.headers, ...headers };
        } else {
          args.push({ headers });
        }

        const res = await (originalMethod as any).apply(target, args);

        if (!res.ok && res.status === 401) {
          // Token is invalid or expired, log the user out
          console.error("API request unauthorized, logging out.");
          authStore.signOut();
        }

        return res;
      };
    }

    // For nested routes (e.g., api.user.me)
    // @ts-ignore
    return target[prop];
  },
});
