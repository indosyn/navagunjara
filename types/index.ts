/**
 * Shared TypeScript types and interfaces for the Navagunjara
 * e-commerce platform.
 *
 * @module types
 * @author Anurag Muthyam
 * @organization indosyn
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type JewelryType =
  | "NECKLACE"
  | "RING"
  | "BRACELET"
  | "EARRING"
  | "ANKLET"
  | "BANGLE"
  | "PENDANT"
  | "BROOCH"
  | "OTHER";

export type ClothingType =
  | "SAREE"
  | "KURTA"
  | "LEHENGA"
  | "SALWAR_KAMEEZ"
  | "DUPATTA"
  | "SHERWANI"
  | "DHOTI"
  | "BLOUSE"
  | "KURTI"
  | "OTHER";

export type ClothingSize =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "XXXL"
  | "FREE_SIZE";

export type Gender = "MALE" | "FEMALE" | "UNISEX";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "COD";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type UserRole = "USER" | "ADMIN";

// ─── Product Types ─────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  publicId: string | null;
  alt: string | null;
  sortOrder: number;
}

export interface BaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  imageUrl: string | null;
  images: ProductImage[];
  category: string | null;
  active: boolean;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface JewelryProduct extends BaseProduct {
  productType: "JEWELRY";
  jewelry: {
    jewelleryType: string | null;
    material: string | null;
    gemstone: string | null;
    weightGrams: string | null;
    caratValue: number | null;
  };
}

export interface ClothingProduct extends BaseProduct {
  productType: "CLOTHING";
  clothing: {
    clothingType: string | null;
    size: string | null;
    color: string;
    fabric: string | null;
    gender: string | null;
  };
}

export type Product = JewelryProduct | ClothingProduct;

// ─── Customer Types ────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  createdAt: string | null;
}

// ─── Order Types ───────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  imageUrl: string | null;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  items: OrderItem[];
  orderedAt: string | null;
  updatedAt: string | null;
}

// ─── Payment Types ─────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  method: string;
  status: PaymentStatus;
  transactionId: string | null;
  failureReason: string | null;
  initiatedAt: string | null;
  completedAt: string | null;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  errorDetail?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  type: "Bearer";
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ─── Cart Types ────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productType: "JEWELRY" | "CLOTHING";
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stockQuantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

// ─── Review Types ──────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

// ─── Wishlist Types ────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: string;
  productImageUrl: string | null;
  productType: "JEWELRY" | "CLOTHING";
  inStock: boolean;
  addedAt: string;
}

// ─── Razorpay Types ────────────────────────────────────────────────────────────

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
