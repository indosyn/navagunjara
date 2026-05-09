/**
 * Authentication — login endpoint.
 *
 * Validates credentials against admin and customer tables, issues a
 * signed JWT (HS256) on success.
 *
 * @route POST /api/v1/auth/login
 * @body  `{ email: string, password: string }`
 * @returns JWT token + user profile on success; 401 on bad credentials.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */

import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.auth.login");

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "dev-secret"
);

/**
 * Handle login requests.
 *
 * @param req - Incoming request with JSON body.
 * @returns JSON response with JWT token or error.
 *
 * @author Anurag Muthyam
 * @organization indosyn
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      log.warn("Validation failed on login attempt");
      return NextResponse.json(
        { success: false, message: "Validation failed", errorDetail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    log.info({ email }, "Login attempt");

    // Check admin
    const admin = await db.admin.findUnique({ where: { email } });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        log.warn({ email }, "Invalid admin credentials");
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = await new SignJWT({
        id: admin.id.toString(),
        email: admin.email,
        role: "ADMIN",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      log.info({ email, role: "ADMIN" }, "Admin login successful");
      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          token,
          type: "Bearer",
          id: admin.id.toString(),
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: "ADMIN",
        },
      });
    }

    // Check customer
    const customer = await db.customer.findUnique({ where: { email } });
    if (!customer) {
      log.warn({ email }, "No account found");
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      log.warn({ email }, "Invalid customer credentials");
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      id: customer.id.toString(),
      email: customer.email,
      role: "USER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    log.info({ email, role: "USER" }, "Customer login successful");
    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        type: "Bearer",
        id: customer.id.toString(),
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        role: "USER",
      },
    });
  } catch (e) {
    log.error({ err: e }, "Login route error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
