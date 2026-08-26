import type { AppEnv } from "./auth";
import { createSession, generateToken, hashPassword } from "./auth";
import type { Context } from "hono";

export type OAuthProvider = "github" | "google";

type OAuthProfile = {
	provider: OAuthProvider;
	providerUserId: string;
	email: string;
};

function getAppOrigin(c: Context<AppEnv>): string {
	const configured = c.env.APP_URL?.replace(/\/$/, "");
	if (configured) return configured;
	const url = new URL(c.req.url);
	return url.origin;
}

function b64url(data: ArrayBuffer | Uint8Array): string {
	const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
	let s = "";
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signState(secret: string, payload: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
	return `${b64url(new TextEncoder().encode(payload))}.${b64url(sig)}`;
}

async function verifyState(secret: string, state: string): Promise<string | null> {
	const [payloadB64, sigB64] = state.split(".");
	if (!payloadB64 || !sigB64) return null;

	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"],
	);

	const pad = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);
	const payloadBytes = Uint8Array.from(atob(pad(payloadB64).replace(/-/g, "+").replace(/_/g, "/")), (c) =>
		c.charCodeAt(0),
	);
	const sigBytes = Uint8Array.from(atob(pad(sigB64).replace(/-/g, "+").replace(/_/g, "/")), (c) =>
		c.charCodeAt(0),
	);

	const ok = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
	if (!ok) return null;

	const payload = new TextDecoder().decode(payloadBytes);
	const [nonce, expStr] = payload.split(":");
	const exp = Number(expStr);
	if (!nonce || !Number.isFinite(exp) || Date.now() > exp) return null;
	return nonce;
}

export async function buildAuthorizeUrl(
	c: Context<AppEnv>,
	provider: OAuthProvider,
): Promise<Response> {
	const stateSecret = c.env.OAUTH_STATE_SECRET || c.env.GITHUB_CLIENT_SECRET || "dev-oauth-state-secret";
	const exp = Date.now() + 10 * 60 * 1000; // 10 min
	const state = await signState(stateSecret, `${generateToken().slice(0, 16)}:${exp}`);
	const origin = getAppOrigin(c);
	const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;

	if (provider === "github") {
		const clientId = c.env.GITHUB_CLIENT_ID;
		if (!clientId) {
			return c.json({ error: "GitHub OAuth is not configured (GITHUB_CLIENT_ID)" }, 503);
		}
		const url = new URL("https://github.com/login/oauth/authorize");
		url.searchParams.set("client_id", clientId);
		url.searchParams.set("redirect_uri", redirectUri);
		url.searchParams.set("scope", "read:user user:email");
		url.searchParams.set("state", state);
		return c.redirect(url.toString(), 302);
	}

	// google
	const clientId = c.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		return c.json({ error: "Google OAuth is not configured (GOOGLE_CLIENT_ID)" }, 503);
	}
	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", "openid email profile");
	url.searchParams.set("state", state);
	url.searchParams.set("access_type", "online");
	url.searchParams.set("prompt", "select_account");
	return c.redirect(url.toString(), 302);
}

async function exchangeGitHub(
	c: Context<AppEnv>,
	code: string,
	redirectUri: string,
): Promise<OAuthProfile> {
	const clientId = c.env.GITHUB_CLIENT_ID;
	const clientSecret = c.env.GITHUB_CLIENT_SECRET;
	if (!clientId || !clientSecret) throw new Error("GitHub OAuth not configured");

	const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		}),
	});
	const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
	if (!tokenData.access_token) {
		throw new Error(tokenData.error || "Failed to get GitHub access token");
	}

	const userRes = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "vite-react-template",
		},
	});
	const ghUser = (await userRes.json()) as { id?: number; email?: string | null; login?: string };
	if (!ghUser.id) throw new Error("Failed to fetch GitHub user");

	let email = ghUser.email ?? null;
	if (!email) {
		const emailsRes = await fetch("https://api.github.com/user/emails", {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "vite-react-template",
			},
		});
		const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
		if (Array.isArray(emails)) {
			const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
			email = primary?.email ?? null;
		}
	}
	if (!email) {
		email = `${ghUser.id}+${ghUser.login || "user"}@users.noreply.github.com`;
	}

	return {
		provider: "github",
		providerUserId: String(ghUser.id),
		email: email.toLowerCase(),
	};
}

async function exchangeGoogle(
	c: Context<AppEnv>,
	code: string,
	redirectUri: string,
): Promise<OAuthProfile> {
	const clientId = c.env.GOOGLE_CLIENT_ID;
	const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

	const body = new URLSearchParams({
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: redirectUri,
		grant_type: "authorization_code",
	});

	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
	if (!tokenData.access_token) {
		throw new Error(tokenData.error || "Failed to get Google access token");
	}

	const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
		headers: { Authorization: `Bearer ${tokenData.access_token}` },
	});
	const gUser = (await userRes.json()) as { id?: string; email?: string; verified_email?: boolean };
	if (!gUser.id || !gUser.email) throw new Error("Failed to fetch Google user profile");

	return {
		provider: "google",
		providerUserId: gUser.id,
		email: gUser.email.toLowerCase(),
	};
}

/** Find or create user + link OAuth account, return session token */
export async function upsertOAuthUser(db: D1Database, profile: OAuthProfile): Promise<{ token: string; user: { id: number; email: string } }> {
	const linked = await db
		.prepare(
			`SELECT u.id, u.email FROM oauth_accounts oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.provider = ? AND oa.provider_user_id = ?`,
		)
		.bind(profile.provider, profile.providerUserId)
		.first<{ id: number; email: string }>();

	if (linked) {
		const token = await createSession(db, linked.id);
		return { token, user: linked };
	}

	// Match existing user by email (link account)
	let user = await db
		.prepare("SELECT id, email FROM users WHERE email = ?")
		.bind(profile.email)
		.first<{ id: number; email: string }>();

	if (!user) {
		// OAuth-only user: store unusable random password hash so NOT NULL column is satisfied
		const unusable = await hashPassword(generateToken());
		user = await db
			.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email")
			.bind(profile.email, unusable)
			.first<{ id: number; email: string }>();
		if (!user) throw new Error("Failed to create user");
	}

	await db
		.prepare("INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES (?, ?, ?)")
		.bind(user.id, profile.provider, profile.providerUserId)
		.run();

	const token = await createSession(db, user.id);
	return { token, user };
}

export async function handleOAuthCallback(
	c: Context<AppEnv>,
	provider: OAuthProvider,
): Promise<Response> {
	const url = new URL(c.req.url);
	const err = url.searchParams.get("error");
	if (err) {
		return c.redirect(`/?auth_error=${encodeURIComponent(err)}`, 302);
	}

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	if (!code || !state) {
		return c.redirect("/?auth_error=missing_code", 302);
	}

	const stateSecret = c.env.OAUTH_STATE_SECRET || c.env.GITHUB_CLIENT_SECRET || "dev-oauth-state-secret";
	const valid = await verifyState(stateSecret, state);
	if (!valid) {
		return c.redirect("/?auth_error=invalid_state", 302);
	}

	const origin = getAppOrigin(c);
	const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;

	try {
		const profile =
			provider === "github"
				? await exchangeGitHub(c, code, redirectUri)
				: await exchangeGoogle(c, code, redirectUri);

		const { token } = await upsertOAuthUser(c.env.DB, profile);
		return c.redirect(`/?auth_token=${encodeURIComponent(token)}`, 302);
	} catch (e) {
		const message = e instanceof Error ? e.message : "oauth_failed";
		return c.redirect(`/?auth_error=${encodeURIComponent(message)}`, 302);
	}
}
