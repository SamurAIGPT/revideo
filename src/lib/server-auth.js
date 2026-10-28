import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DBService } from "@/lib/db";

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) return null;
  return DBService.getUserById(userId);
}
