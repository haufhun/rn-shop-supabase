import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

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
