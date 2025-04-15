import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^16.10.0";

export const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  // This is needed to use the Fetch API rather than relying on the Node http
  // package.
  httpClient: Stripe.createFetchHttpClient(),
});

export const getOrCreateStripeCustomerForSupabaseUser = async (
  req: Request
) => {
  const authHeader = req.headers.get("Authorization")!;
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  // Get the session or user object
  const { data: authUser } = await supabaseClient.auth.getUser();

  if (!authUser) {
    throw new Error("Auth user not found");
  }

  const userId = authUser.user.id;

  const { data: userData, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching public.users:", error);
    throw new Error("Public.user not found");
  }

  if (userData.stripe_customer_id) {
    return userData.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: userData.email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  await supabaseClient
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
};
