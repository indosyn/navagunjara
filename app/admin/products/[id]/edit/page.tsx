/**
 * Admin product edit page — loads existing product and pre-fills the form
 * for either jewelry or clothing.
 *
 * @route /admin/products/:id/edit
 * @access ADMIN
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [productType, setProductType] = useState<"JEWELRY" | "CLOTHING" | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const jewelryForm = useForm<CreateJewelryInput>({
    resolver: zodResolver(createJewelrySchema),
  });

  const clothingForm = useForm<CreateClothingInput>({
    resolver: zodResolver(createClothingSchema),
  });

  /* ── Load product ─────────────────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      // Try jewelry first
      let res = await fetch(`/api/v1/jewelry/${id}`);
      if (res.ok) {
        const json = await res.json();
        const p = json.data;
        setProductType("JEWELRY");
        jewelryForm.reset({
          name: p.name ?? "",
          description: p.description ?? "",
          price: Number(p.price),
          stockQuantity: Number(p.stockQuantity),
          imageUrl: p.imageUrl ?? "",
          jewelleryType: p.jewelry?.jewelleryType ?? "OTHER",
          material: p.jewelry?.material ?? "",
          gemstone: p.jewelry?.gemstone ?? "",
          weightGrams: p.jewelry?.weightGrams
            ? Number(p.jewelry.weightGrams)
            : undefined,
          caratValue: p.jewelry?.caratValue
            ? Number(p.jewelry.caratValue)
            : undefined,
        });
        setLoading(false);
        return;
      }

      // Try clothing
      res = await fetch(`/api/v1/clothing/${id}`);
      if (res.ok) {
        const json = await res.json();
        const p = json.data;
        setProductType("CLOTHING");
        clothingForm.reset({
          name: p.name ?? "",
          description: p.description ?? "",
          price: Number(p.price),
          stockQuantity: Number(p.stockQuantity),
          imageUrl: p.imageUrl ?? "",
          clothingType: p.clothing?.clothingType ?? "OTHER",
          size: p.clothing?.size ?? "FREE_SIZE",
          color: p.clothing?.color ?? "",
          fabric: p.clothing?.fabric ?? "",
          gender: p.clothing?.gender ?? "UNISEX",
        });
        setLoading(false);
        return;
      }

      setError("Product not found.");
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── Submit handlers ──────────────────────────────────────────────────── */
  const onSaveJewelry = async (data: CreateJewelryInput) => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/v1/jewelry/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.message ?? "Update failed.");
      setSaving(false);
      return;
    }
    router.push("/admin/products");
  };

  const onSaveClothing = async (data: CreateClothingInput) => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/v1/clothing/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.message ?? "Update failed.");
      setSaving(false);
      return;
    }
    router.push("/admin/products");
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400">Loading product…</div>
    );
  }

  if (!productType) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error || "Product not found."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        Edit {productType === "JEWELRY" ? "Jewelry" : "Clothing"} #{id}
      </h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {productType === "JEWELRY" ? (
        <form
          onSubmit={jewelryForm.handleSubmit(onSaveJewelry)}
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm"
        >
          <Input
            label="Name"
            required
            {...jewelryForm.register("name")}
            error={jewelryForm.formState.errors.name?.message}
          />
          <Input
            label="Description"
            {...jewelryForm.register("description")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              required
              {...jewelryForm.register("price", { valueAsNumber: true })}
              error={jewelryForm.formState.errors.price?.message}
            />
            <Input
              label="Stock"
              type="number"
              required
              {...jewelryForm.register("stockQuantity", {
                valueAsNumber: true,
              })}
              error={jewelryForm.formState.errors.stockQuantity?.message}
            />
          </div>
          <Input label="Image URL" {...jewelryForm.register("imageUrl")} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...jewelryForm.register("jewelleryType")}
              >
                {[
                  "NECKLACE",
                  "RING",
                  "BRACELET",
                  "EARRING",
                  "ANKLET",
                  "BANGLE",
                  "PENDANT",
                  "BROOCH",
                  "OTHER",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Material"
              required
              {...jewelryForm.register("material")}
              error={jewelryForm.formState.errors.material?.message}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Gemstone" {...jewelryForm.register("gemstone")} />
            <Input
              label="Weight (g)"
              type="number"
              step="0.01"
              {...jewelryForm.register("weightGrams", {
                valueAsNumber: true,
              })}
            />
            <Input
              label="Carat"
              type="number"
              step="0.01"
              {...jewelryForm.register("caratValue", {
                valueAsNumber: true,
              })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={clothingForm.handleSubmit(onSaveClothing)}
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm"
        >
          <Input
            label="Name"
            required
            {...clothingForm.register("name")}
            error={clothingForm.formState.errors.name?.message}
          />
          <Input
            label="Description"
            {...clothingForm.register("description")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              required
              {...clothingForm.register("price", { valueAsNumber: true })}
              error={clothingForm.formState.errors.price?.message}
            />
            <Input
              label="Stock"
              type="number"
              required
              {...clothingForm.register("stockQuantity", {
                valueAsNumber: true,
              })}
              error={clothingForm.formState.errors.stockQuantity?.message}
            />
          </div>
          <Input label="Image URL" {...clothingForm.register("imageUrl")} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...clothingForm.register("clothingType")}
              >
                {[
                  "SAREE",
                  "KURTA",
                  "LEHENGA",
                  "SALWAR_KAMEEZ",
                  "DUPATTA",
                  "SHERWANI",
                  "DHOTI",
                  "BLOUSE",
                  "KURTI",
                  "OTHER",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size *
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...clothingForm.register("size")}
              >
                {[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "XXL",
                  "XXXL",
                  "FREE_SIZE",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...clothingForm.register("gender")}
              >
                {["MALE", "FEMALE", "UNISEX"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color"
              required
              {...clothingForm.register("color")}
              error={clothingForm.formState.errors.color?.message}
            />
            <Input label="Fabric" {...clothingForm.register("fabric")} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
