import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Root element missing");

createRoot(root).render(
	<StrictMode>
		<Auth0Provider
			domain="silkmoments.us.auth0.com"
			clientId="NFWd6eudI4TbilRjYSsduUjIqGtrBYn5"
			authorizationParams={{ redirect_uri: `${window.location.origin}/account` }}
		>
			<App />
		</Auth0Provider>
	</StrictMode>,
);

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker.register("/sw.js");
	});
}
