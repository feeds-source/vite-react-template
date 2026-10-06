import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App.tsx";

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

const app = <App />;

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		{auth0Domain && auth0ClientId ? (
			<Auth0Provider
				domain={auth0Domain}
				clientId={auth0ClientId}
				authorizationParams={{ redirect_uri: window.location.origin }}
			>
				{app}
			</Auth0Provider>
		) : (
			app
		)}
	</StrictMode>,
);

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker.register("/sw.js");
	});
}

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker.register("/sw.js");
	});
}
