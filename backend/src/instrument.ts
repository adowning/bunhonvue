// Import with `import * as Sentry from "@sentry/node"` if you are using ESM

import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://bad0b12c36cf4b731445cc34e5d63f6a@o4510324319191040.ingest.us.sentry.io/4510324319518720",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
