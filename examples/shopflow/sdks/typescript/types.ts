/**
 * Auto-generated TypeScript Interfaces for API Payloads and Responses
 * Extracted from decompiled Retrofit Java interfaces and Moshi/Gson data models
 * Total models: 7
 */

// ============================================================================
// COMMON MODULE MODELS (1)
// ============================================================================

/**
 * Model: Review
 * Nested child model / DTO
 */
export interface Review {
  [key: string]: any;
}

// ============================================================================
// DATA MODULE MODELS (6)
// ============================================================================

/**
 * Model: List_CategoryItem
 * @response For:
 *   - GET products/categories
 */
export interface List_CategoryItem {
  [key: string]: any;
}

/**
 * Model: List_String
 * @response For:
 *   - GET products/category-list
 */
export interface List_String {
  [key: string]: any;
}

/**
 * Model: LoginResponse
 * @response For:
 *   - GET auth/me
 *   - POST auth/login
 */
export interface LoginResponse {
  [key: string]: any;
}

/**
 * Model: Product
 * @response For:
 *   - GET products/{id}
 */
export interface Product {
  id?: number;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  brand?: string;
  sku?: string;
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  returnPolicy?: string;
  reviews?: Review[];
  images?: string[];
  thumbnail?: string;
}

/**
 * Model: ProductsResponse
 * @response For:
 *   - GET products
 *   - GET products/category/{category}
 *   - GET products/search
 */
export interface ProductsResponse {
  [key: string]: any;
}

/**
 * Model: LoginRequest
 * @requestBody For:
 *   - POST auth/login
 */
export interface LoginRequest {
  username?: string;
  password?: string;
  expiresInMins?: number;
}
