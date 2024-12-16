import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure({
  ...outputs,
  API: {
    ...outputs.API,
    Events: {
      ...outputs.API.Events,
      endpoint: outputs.API.Events.endpoint,
      region: outputs.API.Events.region,
      defaultAuthMode: outputs.API.Events.defaultAuthMode,
      apiKey: outputs.API.Events.apiKey,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
