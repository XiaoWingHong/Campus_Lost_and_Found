import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function seed() {
  ensureDir(DATA_DIR);
  ensureDir(UPLOADS_DIR);

  const regularUserId = uuidv4();
  const adminUserId = uuidv4();
  const now = new Date().toISOString();

  const users = {
    users: [
      {
        id: regularUserId,
        eid: "55123456",
        sid: "55123456",
        name: "Chan Tai Man",
        passwordHash: await bcrypt.hash("student123", 12),
        role: "regular",
        isActive: true,
        defaultContact: {
          email: "55123456@student.cityu.edu.hk",
          phone: "+85298765432",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: adminUserId,
        eid: "admin001",
        sid: "admin001",
        name: "Admin Officer",
        passwordHash: await bcrypt.hash("admin123", 12),
        role: "admin",
        isActive: true,
        defaultContact: {
          email: "lostandfound@cityu.edu.hk",
          phone: "+85234420000",
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  writeFileSync(
    path.join(DATA_DIR, "users.json"),
    JSON.stringify(users, null, 2)
  );

  writeFileSync(
    path.join(DATA_DIR, "posts.json"),
    JSON.stringify({ posts: [] }, null, 2)
  );

  writeFileSync(
    path.join(DATA_DIR, "claims.json"),
    JSON.stringify({ claims: [] }, null, 2)
  );

  // Preserve categories if already present
  const catPath = path.join(DATA_DIR, "categories.json");
  if (!existsSync(catPath)) {
    writeFileSync(catPath, JSON.stringify({ categories: [] }, null, 2));
  }

  console.log("Database seeded successfully!");
  console.log(`  Regular user: EID=55123456  password=student123`);
  console.log(`  Admin user:   EID=admin001  password=admin123`);
}

seed().catch(console.error);
