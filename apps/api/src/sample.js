// `npm run dev:sample`: the API on sample data, safe for agents. Nothing
// reaches Supabase or Resend; restarting resets everything.
const { configure, seed, SAMPLE_PORT, SAMPLE_ADMIN_SECRET } = require("./sandbox");

const store = configure();
process.env.API_PORT = String(SAMPLE_PORT);

seed(store).then(({ guests }) => {
  console.log(`[sample] ${guests.length} sample guests; admin secret "${SAMPLE_ADMIN_SECRET}"`);
  console.log(`[sample] a returning guest's referral code: ${guests[0].referral_code}`);
  require("./index");
});
