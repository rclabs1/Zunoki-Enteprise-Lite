import { supabase } from "./supabase/client";

export const brandService = {
  async getBrands() {
    // Brands are global data, accessible to all authenticated users
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("status", "active")
      .order("name");
    if (error) throw error;
    return data;
  },

  async getBrandById(brandId: string) {
    
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();
    if (error) throw error;
    return data;
  },

  async createBrand(brandData: any) {
    
    const { data, error } = await supabase
      .from("brands")
      .insert(brandData)
      .select();
    if (error) throw error;
    return data;
  },

  async updateBrand(brandId: string, brandData: any) {
    
    const { data, error } = await supabase
      .from("brands")
      .update(brandData)
      .eq("id", brandId)
      .select();
    if (error) throw error;
    return data;
  },

  async deleteBrand(brandId: string) {
    
    const { error } = await supabase.from("brands").delete().eq("id", brandId);
    if (error) throw error;
  },

  async uploadBrandLogo(file: File) {
    
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("brand_logos")
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("brand_logos")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },
};
