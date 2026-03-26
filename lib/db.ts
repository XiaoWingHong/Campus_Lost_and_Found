import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import type { User, Post, Claim, Category, SystemLogEvent } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
    return defaultValue;
  }
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Users ───────────────────────────────────────────────

export function getUsers(): User[] {
  return readJsonFile<{ users: User[] }>("users.json", { users: [] }).users;
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEid(eid: string): User | undefined {
  return getUsers().find((u) => u.eid === eid);
}

export function saveUsers(users: User[]): void {
  writeJsonFile("users.json", { users });
}

export function updateUser(
  id: string,
  updates: Partial<User>
): User | undefined {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return undefined;
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveUsers(users);
  return users[index];
}

// ─── Posts ───────────────────────────────────────────────

export function getPosts(): Post[] {
  return readJsonFile<{ posts: Post[] }>("posts.json", { posts: [] }).posts;
}

export function getPostById(id: string): Post | undefined {
  return getPosts().find((p) => p.id === id);
}

export function savePosts(posts: Post[]): void {
  writeJsonFile("posts.json", { posts });
}

export function createPost(post: Post): Post {
  const posts = getPosts();
  posts.push(post);
  savePosts(posts);
  return post;
}

export function updatePost(
  id: string,
  updates: Partial<Post>
): Post | undefined {
  const posts = getPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  posts[index] = {
    ...posts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  savePosts(posts);
  return posts[index];
}

export function deletePost(id: string): boolean {
  const posts = getPosts();
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === posts.length) return false;
  savePosts(filtered);
  return true;
}

// ─── Claims ──────────────────────────────────────────────

export function getClaims(): Claim[] {
  return readJsonFile<{ claims: Claim[] }>("claims.json", { claims: [] })
    .claims;
}

export function getClaimById(id: string): Claim | undefined {
  return getClaims().find((c) => c.id === id);
}

export function getClaimByPostId(postId: string): Claim | undefined {
  return getClaims().find((c) => c.postId === postId);
}

export function saveClaims(claims: Claim[]): void {
  writeJsonFile("claims.json", { claims });
}

export function createClaim(claim: Claim): Claim {
  const claims = getClaims();
  claims.push(claim);
  saveClaims(claims);
  return claim;
}

// ─── Categories ──────────────────────────────────────────

export function getCategories(): Category[] {
  return readJsonFile<{ categories: Category[] }>("categories.json", {
    categories: [],
  }).categories;
}

export function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = [];
  function walk(cats: Category[]) {
    for (const cat of cats) {
      result.push(cat);
      if (cat.children.length > 0) walk(cat.children);
    }
  }
  walk(categories);
  return result;
}

export function findCategoryPath(
  categories: Category[],
  targetId: string
): string[] {
  function search(cats: Category[], path: string[]): string[] | null {
    for (const cat of cats) {
      const currentPath = [...path, cat.label];
      if (cat.id === targetId) return currentPath;
      if (cat.children.length > 0) {
        const found = search(cat.children, currentPath);
        if (found) return found;
      }
    }
    return null;
  }
  return search(categories, []) ?? [];
}

// ─── System Logs ─────────────────────────────────────────

export function getSystemLogs(): SystemLogEvent[] {
  return readJsonFile<{ events: SystemLogEvent[] }>("system-logs.json", {
    events: [],
  }).events;
}

export function saveSystemLogs(events: SystemLogEvent[]): void {
  writeJsonFile("system-logs.json", { events });
}

export function appendSystemLog(event: SystemLogEvent): SystemLogEvent {
  const events = getSystemLogs();
  events.unshift(event);
  saveSystemLogs(events);
  return event;
}
