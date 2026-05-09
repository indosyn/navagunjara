"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerCustomerSchema, type RegisterCustomerInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCustomerInput>({
    resolver: zodResolver(registerCustomerSchema),
  });

  const onSubmit = async (data: RegisterCustomerInput) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/v1/customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.message ?? "Registration failed");
      setLoading(false);
      return;
    }
    router.push("/login?registered=true");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              {...register("firstName")}
              error={errors.firstName?.message}
            />
            <Input
              label="Last Name"
              required
              {...register("lastName")}
              error={errors.lastName?.message}
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Phone"
            required
            maxLength={10}
            placeholder="9876543210"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <Input
            label="Password"
            type="password"
            required
            {...register("password")}
            error={errors.password?.message}
          />
          <Input
            label="Address Line 1"
            required
            {...register("addressLine1")}
            error={errors.addressLine1?.message}
          />
          <Input
            label="Address Line 2"
            {...register("addressLine2")}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              required
              {...register("city")}
              error={errors.city?.message}
            />
            <Input
              label="State"
              required
              {...register("state")}
              error={errors.state?.message}
            />
            <Input
              label="Pincode"
              required
              maxLength={6}
              {...register("pincode")}
              error={errors.pincode?.message}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
