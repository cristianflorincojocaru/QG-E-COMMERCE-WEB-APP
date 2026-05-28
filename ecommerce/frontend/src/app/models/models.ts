export interface Product {
  id:          number;
  name:        string;
  description: string;
  price:       number;
  category:    string;
  imageUrl:    string;
  stock:       number;
}

export interface CartItem {
  id:          number;
  productId:   number;
  productName: string;
  imageUrl:    string;
  unitPrice:   number;
  quantity:    number;
  lineTotal:   number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface AuthResponse {
  token:     string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      string;   // "Customer" | "Admin"
}

export interface OrderItem {
  productId:   number;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  lineTotal:   number;
}

export interface Order {
  id:              number;
  totalPrice:      number;
  shippingAddress: string;
  status:          string;
  createdAt:       string;
  items:           OrderItem[];
}

// Admin-specific models
export interface UserAdmin {
  id:        number;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  createdAt: string;
}

export interface AdminOrder {
  id:              number;
  userId:          number;
  userEmail:       string;
  totalPrice:      number;
  shippingAddress: string;
  status:          string;
  createdAt:       string;
  items:           OrderItem[];
}