// secrets aren't in wrangler.jsonc, so `wrangler types` doesn't generate them.
// set with: yarn wrangler secret put TOKEN
interface Env {
  TOKEN?: string;
}
