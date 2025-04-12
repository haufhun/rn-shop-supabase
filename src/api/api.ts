import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/auth-provider";

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

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("user", user?.id ?? "");

      if (error) {
        throw new Error(
          "An error occurred while fetching data: " + error.message
        );
      }

      return data;
    },
  });
};

export const createOrderItem = () => {
  return useMutation({
    async mutationFn(
      insertData: {
        orderId: number;
        productId: number;
        quanity: number;
      }[]
    ) {
      const mappedInsertData = insertData.map((item) => ({
        order: item.orderId,
        product: item.productId,
        quantity: item.quanity,
      }));

      const { data, error } = await supabase
        .from("order_item")
        .insert(mappedInsertData)
        .select("*, prodcuts:product(*)")
        .single();

      const productQuantities = insertData.reduce(
        (acc, { productId, quanity }) => {
          if (!acc[productId]) {
            acc[productId] = 0;
          }
          acc[productId] += quanity;
          return acc;
        },
        {} as Record<number, number>
      );

      await Promise.all(
        Object.entries(productQuantities).map(([productId, totalQuantity]) => {
          supabase.rpc("decrement_product_quality", {
            product_id: Number(productId),
            quantity: totalQuantity,
          });
        })
      );

      if (error) {
        throw new Error(
          "An error occurred while updating product quantity: " + error.message
        );
      }
    },
  });
};
