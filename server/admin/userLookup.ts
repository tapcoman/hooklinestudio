import { db } from "../db";
import { users, hookGenerations, favoriteHooks } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";

export interface UserLookupResult {
  user: any;
  stats: {
    totalGenerations: number;
    totalFavorites: number;
    accountAge: string;
    lastActivity: string;
  };
  recentActivity: any[];
}

/**
 * Find a user by email for customer support
 * This helps support team identify users when they report issues
 */
export async function findUserByEmail(email: string): Promise<UserLookupResult | null> {
  try {
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const foundUser = user[0];

    // Get user statistics
    const [generationCount] = await db
      .select({ count: count() })
      .from(hookGenerations)
      .where(eq(hookGenerations.userId, foundUser.id));

    const [favoriteCount] = await db
      .select({ count: count() })
      .from(favoriteHooks)
      .where(eq(favoriteHooks.userId, foundUser.id));

    // Get recent activity
    const recentGenerations = await db
      .select({
        id: hookGenerations.id,
        platform: hookGenerations.platform,
        objective: hookGenerations.objective,
        topic: hookGenerations.topic,
        createdAt: hookGenerations.createdAt,
      })
      .from(hookGenerations)
      .where(eq(hookGenerations.userId, foundUser.id))
      .orderBy(desc(hookGenerations.createdAt))
      .limit(5);

    // Calculate account age
    const accountAge = foundUser.createdAt
      ? Math.floor((Date.now() - new Date(foundUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Find last activity
    const lastActivity = recentGenerations.length > 0
      ? recentGenerations[0].createdAt
      : foundUser.createdAt;

    const lastActivityDays = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      user: {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        company: foundUser.company,
        industry: foundUser.industry,
        role: foundUser.role,
        freeCredits: foundUser.freeCredits,
        usedCredits: foundUser.usedCredits,
        isPremium: foundUser.isPremium,
        createdAt: foundUser.createdAt,
      },
      stats: {
        totalGenerations: generationCount.count,
        totalFavorites: favoriteCount.count,
        accountAge: `${accountAge} days`,
        lastActivity: `${lastActivityDays} days ago`,
      },
      recentActivity: recentGenerations,
    };
  } catch (error) {
    console.error("Error looking up user:", error);
    throw error;
  }
}

/**
 * Find a user by their unique ID for support
 */
export async function findUserById(userId: string): Promise<UserLookupResult | null> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const foundUser = user[0];
    return findUserByEmail(foundUser.email!);
  } catch (error) {
    console.error("Error looking up user by ID:", error);
    throw error;
  }
}

/**
 * Search users by company name for team support
 */
export async function findUsersByCompany(companyName: string): Promise<any[]> {
  try {
    const users_result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        company: users.company,
        role: users.role,
        isPremium: users.isPremium,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.company, companyName))
      .orderBy(desc(users.createdAt))
      .limit(20);

    return users_result;
  } catch (error) {
    console.error("Error searching users by company:", error);
    throw error;
  }
}

/**
 * Get user support summary - everything support needs to know
 */
export async function getUserSupportSummary(email: string): Promise<string> {
  const userInfo = await findUserByEmail(email);
  
  if (!userInfo) {
    return `❌ User not found: ${email}`;
  }

  const { user, stats, recentActivity } = userInfo;

  return `
📧 User Support Summary for: ${email}

👤 User Details:
- ID: ${user.id}
- Name: ${user.firstName} ${user.lastName}
- Company: ${user.company || 'Not specified'}
- Role: ${user.role || 'Not specified'}
- Industry: ${user.industry || 'Not specified'}

💳 Account Status:
- Premium: ${user.isPremium ? '✅ Yes' : '❌ No'}
- Credits Used: ${user.usedCredits}/${parseInt(user.freeCredits) + parseInt(user.usedCredits)}
- Account Age: ${stats.accountAge}
- Last Activity: ${stats.lastActivity}

📊 Usage Statistics:
- Total Hook Generations: ${stats.totalGenerations}
- Total Saved Favorites: ${stats.totalFavorites}

🔄 Recent Activity:
${recentActivity.slice(0, 3).map(activity => 
  `- ${activity.platform} (${activity.objective}): "${activity.topic}" - ${new Date(activity.createdAt).toLocaleDateString()}`
).join('\n')}

💡 Support Notes:
- User can be identified by email: ${email}
- User ID for technical issues: ${user.id}
- Account created: ${new Date(user.createdAt).toLocaleDateString()}
`;
}