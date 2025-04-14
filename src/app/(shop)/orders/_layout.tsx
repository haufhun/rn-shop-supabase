import React from "react";
import { Stack } from "expo-router";
import { useOrderUpdateSubscription } from "../../../api/subscriptions";

const OrdersLayout = () => {
  useOrderUpdateSubscription();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
};

export default OrdersLayout;
