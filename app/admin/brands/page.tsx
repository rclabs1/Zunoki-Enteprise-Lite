"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { brandService } from "@/lib/brand-service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useTrackPageView } from "@/hooks/use-track-page-view";

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  reach: z.string().min(1, "Reach is required"),
  cpm: z.string().min(1, "CPM is required"),
  logo: z.any(),
  category: z.enum(["Digital", "CTV", "DOOH", "App"], { required_error: "Category is required" }),
  targetGroup: z.string().min(1, "Target group is required (comma-separated)"),
  tags: z.string().min(1, "Tags are required (comma-separated)"),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function AdminBrandsPage() {
  useTrackPageView("Admin Brands");
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLogoFile(event.target.files[0]);
    } else {
      setLogoFile(null);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login"); // Redirect to login if not authenticated or not an admin
    }
    if (isAdmin) {
      fetchBrands();
    }
  }, [user, loading, isAdmin, router]);

  const fetchBrands = async () => {
    try {
      const fetchedBrands = await brandService.getBrands();
      setBrands(fetchedBrands);
    } catch (error) {
      toast({
        title: "Error fetching brands",
        description: "Failed to load brands. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: BrandFormData) => {
    try {
      const brandData = {
        ...data,
        targetGroup: data.targetGroup.split(",").map((s) => s.trim()),
        tags: data.tags.split(",").map((s) => s.trim()),
      };

      let finalBrandData = {
        ...brandData,
        logo: editingBrand?.logo || "", // Default to existing logo or empty string
      };

      if (logoFile) {
        const logoUrl = await brandService.uploadBrandLogo(logoFile);
        finalBrandData.logo = logoUrl;
      }

      if (editingBrand) {
        await brandService.updateBrand(editingBrand.id, finalBrandData);
        toast({
          title: "Brand updated",
          description: "Brand details have been successfully updated.",
        });
      } else {
        await brandService.createBrand(finalBrandData);
        toast({
          title: "Brand created",
          description: "New brand has been successfully added.",
        });
      }
      fetchBrands();
      setIsModalOpen(false);
      reset();
      setEditingBrand(null);
    } catch (error) {
      toast({
        title: "Error saving brand",
        description: "Failed to save brand. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);

  const handleDeleteConfirmation = async () => {
    if (deletingBrandId) {
      try {
        await brandService.deleteBrand(deletingBrandId);
        toast({
          title: "Brand deleted",
          description: "Brand has been successfully deleted.",
        });
        fetchBrands();
      } catch (error) {
        toast({
          title: "Error deleting brand",
          description: "Failed to delete brand. Please try again.",
          variant: "destructive",
        });
      }
    }
    setIsDeleteModalOpen(false);
    setDeletingBrandId(null);
  };

  const handleDelete = (brandId: string) => {
    setDeletingBrandId(brandId);
    setIsDeleteModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    reset({
      name: "",
      reach: "",
      cpm: "",
      logo: undefined,
      category: "Digital",
      targetGroup: "",
      tags: "",
    });
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    reset({
      name: brand.name,
      reach: brand.reach,
      cpm: brand.cpm,
      logo: undefined,
      category: brand.category,
      targetGroup: (brand.targetGroup || []).join(", "),
      tags: (brand.tags || []).join(", "),
    });
    setLogoFile(null);
    setIsModalOpen(true);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-4xl font-bold mb-8">Manage Brands</h1>
        <div className="mb-6">
          <Skeleton className="h-10 w-36 bg-gray-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
              <Skeleton className="h-8 w-3/4 mb-4 bg-gray-800" />
              <Skeleton className="h-4 w-1/2 mb-4 bg-gray-800" />
              <Skeleton className="h-4 w-1/4 mb-2 bg-gray-800" />
              <Skeleton className="h-4 w-1/4 mb-4 bg-gray-800" />
              <div className="flex flex-wrap gap-2 mt-2">
                <Skeleton className="h-6 w-16 bg-gray-800 rounded-full" />
                <Skeleton className="h-6 w-20 bg-gray-800 rounded-full" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-10 w-20 bg-gray-800" />
                <Skeleton className="h-10 w-20 bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    router.push("/login");
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Manage Brands</h1>
      <Button onClick={openCreateModal} className="mb-6 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
        Add New Brand
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <div key={brand.id} className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
            <h2 className="text-2xl font-semibold mb-2">{brand.name}</h2>
            <p className="text-gray-400 mb-4">{brand.category}</p>
            <p>Reach: {brand.reach}</p>
            <p>CPM: {brand.cpm}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(brand.targetGroup || []).map((tg: string) => (
                <span key={tg} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                  {tg}
                </span>
              ))}
              {(brand.tags || []).map((tag: string) => (
                <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => openEditModal(brand)} variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Edit
              </Button>
              <Button onClick={() => handleDelete(brand.id)} variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] bg-black text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingBrand ? "Edit the details of the brand." : "Fill in the details for the new brand."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-300">Name</Label>
              <Input id="name" {...register("name")} className="col-span-3 bg-gray-800 text-white border-gray-700" />
              {errors.name && <p className="col-span-4 text-red-500 text-sm">{errors.name.message ?? ''}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reach" className="text-right text-gray-300">Reach</Label>
              <Input id="reach" {...register("reach")} className="col-span-3 bg-gray-800 text-white border-gray-700" />
              {errors.reach && <p className="col-span-4 text-red-500 text-sm">{errors.reach.message ?? ''}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpm" className="text-right text-gray-300">CPM</Label>
              <Input id="cpm" {...register("cpm")} className="col-span-3 bg-gray-800 text-white border-gray-700" />
              {errors.cpm && <p className="col-span-4 text-red-500 text-sm">{errors.cpm.message ?? ''}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logo" className="text-right text-gray-300">Logo File</Label>
              <div className="col-span-3">
                <Input id="logo" type="file" onChange={handleFileChange} className="bg-gray-800 text-white border-gray-700" />
                {editingBrand?.logo && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-sm mb-1">Current Logo:</p>
                    <img src={editingBrand.logo} alt="Current Logo" className="w-24 h-24 object-contain rounded-md" />
                  </div>
                )}
              </div>
              {errors.logo?.message && <p className="col-span-4 text-red-500 text-sm">{String(errors.logo.message)}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-gray-300">Category</Label>
              <select id="category" {...register("category")} className="col-span-3 bg-gray-800 text-white border-gray-700 p-2 rounded-md">
                <option value="Digital">Digital</option>
                <option value="CTV">CTV</option>
                <option value="DOOH">DOOH</option>
                <option value="App">App</option>
              </select>
              {errors.category && <p className="col-span-4 text-red-500 text-sm">{errors.category.message ?? ''}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetGroup" className="text-right text-gray-300">Target Group (comma-separated)</Label>
              <Textarea id="targetGroup" {...register("targetGroup")} className="col-span-3 bg-gray-800 text-white border-gray-700" />
              {errors.targetGroup && <p className="col-span-4 text-red-500 text-sm">{errors.targetGroup.message ?? ''}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right text-gray-300">Tags (comma-separated)</Label>
              <Textarea id="tags" {...register("tags")} className="col-span-3 bg-gray-800 text-white border-gray-700" />
              {errors.tags && <p className="col-span-4 text-red-500 text-sm">{errors.tags.message ?? ''}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-700 text-white hover:bg-gray-800">
                Cancel
              </Button>
              <Button type="submit" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                {editingBrand ? "Update Brand" : "Add Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirmation}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the brand."
      />
    </div>
  );
}