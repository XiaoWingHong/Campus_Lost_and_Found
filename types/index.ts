export type UserRole = "regular" | "admin";

export type PostStatus =
  | "pending"
  | "published"
  | "rejected"
  | "claimed"
  | "cancelled";

export interface User {
  id: string;
  eid: string;
  sid?: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  defaultContact: {
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  status: PostStatus;
  itemName: string;
  categoryPath: string[];
  description: string;
  dateLost: string;
  timeLost: string | null;
  locationLost: string;
  photos: string[];
  contactInfo: {
    useDefault: boolean;
    email: string | null;
    phone: string | null;
  };
  rejectionReason: string | null;
  claimId: string | null;
  siftDescriptors: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  editedAt: string | null;
  editNote: string | null;
}

export interface Claim {
  id: string;
  postId: string;
  claimerId: string;
  claimerName: string;
  claimerEid: string;
  claimerSid?: string;
  contactEmail: string;
  contactPhone: string;
  claimedAt: string;
  unclaimedAt: string | null;
  unclaimedBy: string | null;
}

export interface Category {
  id: string;
  label: string;
  parentId: string | null;
  children: Category[];
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePostInput {
  itemName: string;
  categoryPath: string[];
  description: string;
  dateLost: string;
  timeLost: string | null;
  locationLost: string;
  contactInfo: {
    useDefault: boolean;
    email: string | null;
    phone: string | null;
  };
}

export interface ClaimInput {
  contactEmail: string;
  contactPhone: string;
}

export interface LoginInput {
  eid: string;
  password: string;
}

export interface UpdateContactInput {
  email: string;
  phone: string;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    name: string;
    eid: string;
    sid?: string;
  };
  resolvedContact: {
    email: string;
    phone: string;
  };
}

export interface PostWithClaim extends PostWithAuthor {
  claim: Claim | null;
}

export interface AppStats {
  totalPosts: number;
  totalClaimed: number;
  totalUsers: number;
}

export type SystemLogAction =
  | "post_approved"
  | "post_rejected"
  | "post_unclaimed"
  | "post_cancelled"
  | "post_updated";

export interface SystemLogEvent {
  id: string;
  action: SystemLogAction;
  actorId: string;
  actorName: string;
  postId?: string;
  userId?: string;
  detail: string;
  createdAt: string;
}
