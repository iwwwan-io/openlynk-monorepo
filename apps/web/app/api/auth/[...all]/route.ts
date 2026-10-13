import { auth, toNextJsHandler } from "@openlynk/auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
