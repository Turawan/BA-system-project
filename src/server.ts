import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`${env.appName} is running at http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});
