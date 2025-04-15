// 1. setup payment sheet
// 2 open stripe checkout form

import {
  initPaymentSheet,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { supabase } from "./supabase";
import { CollectionMode } from "@stripe/stripe-react-native/lib/typescript/src/types/PaymentSheet";

export const fetchStripeKeys = async (totalAmount: number) => {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body: JSON.stringify({ totalAmount }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const setupStripePaymentSheet = async (totalAmount: number) => {
  const { paymentIntent, publicKey, ephemeralKey, customerId } =
    await fetchStripeKeys(totalAmount);

  if (!paymentIntent || !publicKey) {
    throw new Error("Failed to fetch Stripe keys");
  }

  await initPaymentSheet({
    merchantDisplayName: "Codewithlari",
    paymentIntentClientSecret: paymentIntent,
    customerId,
    customerEphemeralKeySecret: ephemeralKey,
    billingDetailsCollectionConfiguration: {
      name: "always" as CollectionMode,
      phone: "always" as CollectionMode,
    },
    // returnURL: "/",
  });
};

export const openStripeCheckout = async () => {
  const { error } = await presentPaymentSheet();

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
