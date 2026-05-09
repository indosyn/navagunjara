/**
 * Customer account page — profile info, password change, and recent orders.
 *
 * @route /account
 * @access Authenticated (redirected by middleware)
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateCustomerSchema,
  changePasswordSchema,
  type UpdateCustomerInput,
  type ChangePasswordInput,
} from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";

export default function AccountPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [tab, setTab] = useState<"profile" | "password" | "orders">("profile");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  /* ── Load profile + recent orders ─────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/v1/customers/me"),
        fetch("/api/v1/orders?page=0&size=5"),
      ]);
      if (pRes.ok) {
        const pJson = await pRes.json();
        setProfile(pJson.data);
      }
      if (oRes.ok) {
        const oJson = await oRes.json();
        setOrders(oJson.data?.content ?? []);
      }
    }
    load();
  }, []);

  /* ── Profile form ─────────────────────────────────────────────────────── */
  const profileForm = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: (profile.firstName as string) ?? "",
        lastName: (profile.lastName as string) ?? "",
        phone: (profile.phone as string) ?? "",
        addressLine1: (profile.addressLine1 as string) ?? "",
        addressLine2: (profile.addressLine2 as string) ?? "",
        city: (profile.city as string) ?? "",
        state: (profile.state as string) ?? "",
        pincode: (profile.pincode as string) ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const onUpdateProfile = async (data: UpdateCustomerInput) => {
    setMsg("");
    setErr("");
    const res = await fetch(`/api/v1/customers/${session?.user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setMsg("Profile updated successfully.");
      const json = await res.json();
      setProfile(json.data);
    } else {
      const json = await res.json();
      setErr(json.message ?? "Update failed.");
    }
  };

  /* ── Password form ────────────────────────────────────────────────────── */
  const pwForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordInput) => {
    setMsg("");
    setErr("");
    const res = await fetch("/api/v1/customers/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setMsg("Password changed successfully.");
      pwForm.reset();
    } else {
      const json = await res.json();
      setErr(json.message ?? "Password change failed.");
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Account</h1>
      <p className="text-gray-500 mb-8">
        {profile.email as string}
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        {(["profile", "password", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setMsg("");
              setErr("");
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-amber-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t === "profile" ? "Profile" : t === "password" ? "Password" : "Orders"}
          </button>
        ))}
      </div>

      {msg && <p className="text-green-600 text-sm mb-4">{msg}</p>}
      {err && <p className="text-red-600 text-sm mb-4">{err}</p>}

      {/* ── Profile Tab ────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <form
          onSubmit={profileForm.handleSubmit(onUpdateProfile)}
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm max-w-xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...profileForm.register("firstName")}
              error={profileForm.formState.errors.firstName?.message}
            />
            <Input
              label="Last Name"
              {...profileForm.register("lastName")}
              error={profileForm.formState.errors.lastName?.message}
            />
          </div>
          <Input
            label="Phone"
            {...profileForm.register("phone")}
            error={profileForm.formState.errors.phone?.message}
          />
          <Input
            label="Address Line 1"
            {...profileForm.register("addressLine1")}
          />
          <Input
            label="Address Line 2"
            {...profileForm.register("addressLine2")}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" {...profileForm.register("city")} />
            <Input label="State" {...profileForm.register("state")} />
            <Input
              label="Pincode"
              {...profileForm.register("pincode")}
              error={profileForm.formState.errors.pincode?.message}
            />
          </div>
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      )}

      {/* ── Password Tab ───────────────────────────────────────────────── */}
      {tab === "password" && (
        <form
          onSubmit={pwForm.handleSubmit(onChangePassword)}
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm max-w-md"
        >
          <Input
            label="Current Password"
            type="password"
            {...pwForm.register("currentPassword")}
            error={pwForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            {...pwForm.register("newPassword")}
            error={pwForm.formState.errors.newPassword?.message}
          />
          <Button type="submit" className="w-full">
            Change Password
          </Button>
        </form>
      )}

      {/* ── Orders Tab ─────────────────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              No orders yet.
            </p>
          ) : (
            orders.map((o) => (
              <div
                key={String(o.id)}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Order #{String(o.id)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {o.orderedAt
                      ? new Date(String(o.orderedAt)).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-amber-700">
                    {formatINR(o.totalAmount as number)}
                  </p>
                  <Badge label={String(o.status)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
