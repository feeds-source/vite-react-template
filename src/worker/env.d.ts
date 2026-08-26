/** Worker bindings from wrangler.json (DB, APP_URL) and .dev.vars / secrets. */
interface Env {
	DB: D1Database;
	APP_URL: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	OAUTH_STATE_SECRET: string;
}
