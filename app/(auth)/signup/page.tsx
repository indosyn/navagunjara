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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-bold text-[var(--color-primary)]">
            Navagunjara
          </Link>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border)] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                placeholder="Anurag"
                {...register("firstName")}
                error={errors.firstName?.message}
              />
              <Input
                label="Last Name"
                required
                placeholder="Muthyam"
                {...register("lastName")}
                error={errors.lastName?.message}
              />
            </div>
            <Input
              label="Email"
              type="email"
              required
              placeholder="you@example.com"
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
              placeholder="Min. 8 characters"
              {...register("password")}
              error={errors.password?.message}
            />

            <div className="border-t border-[var(--color-border)] pt-5">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Delivery Address</h3>
              <div className="space-y-4">
                <Input
                  label="Address Line 1"
                  required
                  placeholder="Street address"
                  {...register("addressLine1")}
                  error={errors.addressLine1?.message}
                />
                <Input
                  label="Address Line 2"
                  placeholder="Apartment, suite, etc. (optional)"
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
                    placeholder="560001"
                    {...register("pincode")}
                    error={errors.pincode?.message}
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-error)] bg-red-50 px-3 py-2.5 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
