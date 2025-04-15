import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/auth-provider";
import { generateOrderSlug } from "../lib/utils";

export const getProductsAndCategories = () => {
  return useQuery({
    queryKey: ["products", "categories"],
    queryFn: async () => {
      const [products, categories] = await Promise.all([
        supabase.from("product").select("*"),
        supabase.from("category").select("*"),
      ]);

      if (products.error || categories.error) {
        throw new Error("An error occurred while fetching data");
      }

      return { products: products.data, categories: categories.data };
    },
  });
};

export const getProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        throw new Error(
          "An error occurred while fetching data" + error.message
        );
      }

      return data;
    },
  });
};

export const getCategoryAndProducts = (categorySlug: string) => {
  return useQuery({
    queryKey: ["categoryAndProducts", categorySlug],
    queryFn: async () => {
      const { data: category, error } = await supabase
        .from("category")
        .select("*")
        .eq("slug", categorySlug)
        .single();

      if (error || !category) {
        throw new Error("An error occurred while fetching data");
      }

      const { data: products, error: productsError } = await supabase
        .from("product")
        .select("*")
        .eq("category", category.id);
      if (productsError) {
        throw new Error(
          "An error occurred while fetching data" + productsError.message
        );
      }

      return { category, products };
    },
  });
};

export const getMyOrders = () => {
  const { user } = useAuth();
  const id = user?.id ?? "";

  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("user", id);

      if (error) {
        throw new Error(
          "An error occurred while fetching data: " + error.message
        );
      }

      return data;
    },
  });
};

export const createOrder = () => {
  const { user } = useAuth();
  const id = user?.id ?? "";
  console.log("user id", id);

  if (!id) {
    throw new Error("User ID is not available");
  }

  const slug = generateOrderSlug();

  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn({ totalPrice }: { totalPrice: number }) {
      const { data, error } = await supabase
        .from("order")
        .insert({
          total_price: totalPrice,
          slug,
          user: id,
          status: "Pending",
        })
        .select("*")
        .single();

      if (error)
        throw new Error(
          "An error occurred while creating order: " + error.message
        );

      return data;
    },

    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
};

export const createOrderItem = () => {
  return useMutation({
    async mutationFn(
      insertData: {
        orderId: number;
        productId: number;
        quantity: number;
      }[]
    ) {
      const mappedInsertData = insertData.map((item) => ({
        order: item.orderId,
        product: item.productId,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase
        .from("order_item")
        .insert(mappedInsertData)
        .select("*, prodcuts:product(*)");

      const productQuantities = insertData.reduce(
        (acc, { productId, quantity: quanity }) => {
          if (!acc[productId]) {
            acc[productId] = 0;
          }
          acc[productId] += quanity;
          return acc;
        },
        {} as Record<number, number>
      );

      const promises = Object.entries(productQuantities).map(
        async ([productId, totalQuantity]) => {
          const { error: rpcError } = await supabase.rpc(
            "decrement_product_quality",
            {
              product_id: Number(productId),
              quantity: totalQuantity,
            }
          );

          if (rpcError) {
            console.error("Error decrementing product quantity:", rpcError);
          }
        }
      );
      await Promise.all(promises);

      if (error) {
        throw new Error(
          "An error occurred while updating product quantity: " + error.message
        );
      }
    },
  });
};

export const getMyOrder = (slug: string) => {
  const { user } = useAuth();
  const id = user?.id ?? "";

  return useQuery({
    queryKey: ["orders", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order")
        .select("*, order_items:order_item(*, products:product(*))")
        .eq("slug", slug)
        .eq("user", id)
        .single();

      if (error || !data) {
        throw new Error(
          "An error occurred while fetching data: " + error?.message
        );
      }

      return data;
    },
  });
};
