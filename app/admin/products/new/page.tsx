"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createJewelrySchema,
  createClothingSchema,
  type CreateJewelryInput,
  type CreateClothingInput,
} from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type ProductType = "JEWELRY" | "CLOTHING";

export default function NewProductPage() {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>("JEWELRY");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const jewelryForm = useForm<CreateJewelryInput>({
    resolver: zodResolver(createJewelrySchema),
  });

  const clothingForm = useForm<CreateClothingInput>({
    resolver: zodResolver(createClothingSchema),
  });

  const onSubmitJewelry = async (data: CreateJewelryInput) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/v1/jewelry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.message);
      setLoading(false);
      return;
    }
    router.push("/admin/products");
  };

  const onSubmitClothing = async (data: CreateClothingInput) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/v1/clothing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.message);
      setLoading(false);
      return;
    }
    router.push("/admin/products");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      <div className="flex gap-2 mb-6">
        {(["JEWELRY", "CLOTHING"] as ProductType[]).map((t) => (
          <button
            key={t}
            onClick={() => setProductType(t)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              productType === t
                ? "bg-amber-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {productType === "JEWELRY" ? (
        <form
          onSubmit={jewelryForm.handleSubmit(onSubmitJewelry)}
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm"
        >
          <Input label="Name" required {...jewelryForm.register("name")} error={jewelryForm.formState.errors.name?.message} />
          <Input label="Description" {...jewelryForm.register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" step="0.01" required {...jewelryForm.register("price", { valueAsNumber: true })} error={jewelryForm.formState.errors.price?.message} />
            <Input label="Stock" type="number" required {...jewelryForm.register("stockQuantity", { valueAsNumber: true })} error={jewelryForm.formState.errors.stockQuantity?.message} />
          </div>
          <Input label="Image URL" {...jewelryForm.register("imageUrl")} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" {...jewelryForm.register("jewelleryType")}>
                {["NECKLACE", "RING", "BRACELET", "EARRING", "ANKLET", "BANGLE", "PENDANT", "BROOCH", "OTHER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Input label="Material" required {...jewelryForm.register("material")} error={jewelryForm.formState.errors.material?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Gemstone" {...jewelryForm.register("gemstone")} />
            <Input label="Weight (g)" type="number" step="0.01" {...jewelryForm.register("weightGrams", { valueAsNumber: true })} />
            <Input label="Carat" type="number" step="0.01" {...jewelryForm.register("caratValue", { valueAsNumber: true })} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Jewelry"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={clothingForm.handleSubmit(onSubmitClothing)}
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm"
        >
          <Input label="Name" required {...clothingForm.register("name")} error={clothingForm.formState.errors.name?.message} />
          <Input label="Description" {...clothingForm.register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" step="0.01" required {...clothingForm.register("price", { valueAsNumber: true })} error={clothingForm.formState.errors.price?.message} />
            <Input label="Stock" type="number" required {...clothingForm.register("stockQuantity", { valueAsNumber: true })} error={clothingForm.formState.errors.stockQuantity?.message} />
          </div>
          <Input label="Image URL" {...clothingForm.register("imageUrl")} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" {...clothingForm.register("clothingType")}>
                {["SAREE", "KURTA", "LEHENGA", "SALWAR_KAMEEZ", "DUPATTA", "SHERWANI", "DHOTI", "BLOUSE", "KURTI", "OTHER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" {...clothingForm.register("size")}>
                {["XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE_SIZE"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" {...clothingForm.register("gender")}>
                {["MALE", "FEMALE", "UNISEX"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Color" required {...clothingForm.register("color")} error={clothingForm.formState.errors.color?.message} />
            <Input label="Fabric" {...clothingForm.register("fabric")} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Clothing"}
          </Button>
        </form>
      )}
    </div>
  );
}
