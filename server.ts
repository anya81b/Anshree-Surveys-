import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db";
import { surveys, surveyResponses, users, redemptions } from "./src/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "./src/middleware/auth";
import { getOrCreateUser } from "./src/db/users";

async function notifyUsersForSurvey(survey: any) {
  const HIGH_VALUE_THRESHOLD = 500;
  const NOTIFY_TYPES = [
    "Personality & Psychology", 
    "AI Video", 
    "Brand Advertisement",
    "Selfie Video Response",
    "Product Packaging Comparison"
  ];

  const isHighValue = survey.rewardPoints >= HIGH_VALUE_THRESHOLD;
  const isTargetType = NOTIFY_TYPES.includes(survey.type);

  if (isHighValue || isTargetType) {
    try {
      const allUsers = await db.select().from(users).where(eq(users.role, 'user'));
      if (allUsers.length === 0) return;

      console.log(`\n======================================================`);
      console.log(`📧 [EMAIL NOTIFICATION SERVICE]`);
      console.log(`Sending summary email to ${allUsers.length} users...`);
      console.log(`Subject: New ${isHighValue ? 'High-Value ' : ''}Survey Available: ${survey.title}`);
      console.log(`Body: Earn ${survey.rewardPoints} pts! Log in to take the ${survey.type} survey now.`);
      console.log(`======================================================\n`);
      
      // In a real production application, we would call an external API (like Resend, SendGrid) here.
    } catch (e) {
      console.error("Error sending notification:", e);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth sync endpoint to create user in DB on first login
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const user = await getOrCreateUser(uid, email || "");
      res.json({ user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Auth sync failed" });
    }
  });

  // Get surveys
  app.get("/api/surveys", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({
        where: eq(users.uid, uid)
      });
      if (!dbUser) return res.status(401).json({ error: "User not found in db" });
      if (dbUser.isBanned) return res.status(403).json({ error: "Your account has been banned." });

      if (dbUser.role === "admin") {
        const allSurveys = await db.select().from(surveys).orderBy(desc(surveys.createdAt));
        res.json(allSurveys);
      } else {
        const activeSurveys = await db.select().from(surveys).where(eq(surveys.status, "active")).orderBy(desc(surveys.createdAt));
        
        const completed = await db.select().from(surveyResponses).where(eq(surveyResponses.userId, dbUser.id));
        const completedMap = new Map(completed.map(c => [c.surveyId, true]));
        
        const visibleSurveys = activeSurveys.filter(s => {
          if (s.repeatable) return true;
          return !completedMap.has(s.id);
        });

        res.json(visibleSurveys);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load surveys" });
    }
  });

  app.get("/api/surveys/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const survey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });
      if (survey) {
        res.json(survey);
      } else {
        res.status(404).json({ error: "Survey not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching survey" });
    }
  });

  app.post("/api/surveys", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const newSurvey = await db.insert(surveys).values({
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        rewardPoints: parseInt(req.body.rewardPoints),
        eligibility: req.body.eligibility,
        category: req.body.category,
        estimatedCompletionTime: parseInt(req.body.estimatedCompletionTime),
        status: req.body.status || 'draft',
        repeatable: req.body.repeatable || false,
        content: req.body.content || {},
      }).returning();
      
      if (newSurvey[0].status === 'active') {
        notifyUsersForSurvey(newSurvey[0]);
      }
      
      res.json(newSurvey[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error creating survey" });
    }
  });

  app.put("/api/surveys/:id/status", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const updated = await db.update(surveys)
        .set({ status: req.body.status })
        .where(eq(surveys.id, parseInt(req.params.id)))
        .returning();
        
      if (updated[0].status === 'active') {
        notifyUsersForSurvey(updated[0]);
      }
        
      res.json(updated[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error updating survey status" });
    }
  });

  app.post("/api/surveys/:id/submit", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (!dbUser) return res.status(401).json({ error: "User not found" });
      if (dbUser.isBanned) return res.status(403).json({ error: "Your account has been banned." });

      const surveyId = parseInt(req.params.id);
      
      const survey = await db.query.surveys.findFirst({ where: eq(surveys.id, surveyId) });
      if (!survey || survey.status !== 'active') {
        return res.status(400).json({ error: "Survey not available" });
      }

      if (!survey.repeatable) {
        const existing = await db.query.surveyResponses.findFirst({
          where: and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.userId, dbUser.id))
        });
        if (existing) {
          return res.status(400).json({ error: "Survey already completed" });
        }
      }

      await db.insert(surveyResponses).values({
        surveyId,
        userId: dbUser.id,
        responseData: req.body.responseData
      });

      res.json({ success: true, earned: survey.rewardPoints });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error submitting survey" });
    }
  });

  app.get("/api/user/stats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (!dbUser) return res.status(401).json({ error: "User not found" });

      const activeSurveys = await db.select().from(surveys).where(eq(surveys.status, "active"));
      const completed = await db.select().from(surveyResponses).where(eq(surveyResponses.userId, dbUser.id));
      const completedMap = new Map(completed.map(c => [c.surveyId, true]));

      const availableCount = activeSurveys.filter(s => s.repeatable || !completedMap.has(s.id)).length;

      const approvedResponses = completed.filter(c => c.status === "approved");
      let lifetimeEarnings = 0;
      for (const r of approvedResponses) {
        const survey = await db.query.surveys.findFirst({ where: eq(surveys.id, r.surveyId) });
        if (survey) lifetimeEarnings += survey.rewardPoints;
      }

      const totalHandled = completed.filter(c => c.status !== "pending").length;
      const successRate = totalHandled > 0 ? Math.round((approvedResponses.length / totalHandled) * 100) : 100;

      let rank = "Bronze";
      if (lifetimeEarnings >= 5000) rank = "Platinum";
      else if (lifetimeEarnings >= 2000) rank = "Gold";
      else if (lifetimeEarnings >= 500) rank = "Silver";

      res.json({
        surveysAvailable: availableCount,
        pointsEarned: lifetimeEarnings,
        successRate: `${successRate}%`,
        currentRank: rank
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching stats" });
    }
  });

  app.get("/api/user/wallet", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (!dbUser) return res.status(401).json({ error: "User not found" });
      if (dbUser.isBanned) return res.status(403).json({ error: "Your account has been banned." });

      const responses = await db.select({ 
        rewardPoints: surveys.rewardPoints,
        title: surveys.title,
        type: surveys.type,
        completedAt: surveyResponses.completedAt,
        status: surveyResponses.status
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .where(eq(surveyResponses.userId, dbUser.id));

      const redemptionsList = await db.select().from(redemptions).where(eq(redemptions.userId, dbUser.id));

      let lifetimeEarnings = 0;
      let totalRedeemed = 0;
      let pendingPoints = 0;
      let pendingRedemptions = 0;
      
      const history: any[] = [];
      
      responses.forEach((r, i) => {
        if (r.status === 'approved') {
          lifetimeEarnings += r.rewardPoints;
        } else if (r.status === 'pending') {
          pendingPoints += r.rewardPoints;
        }

        if (r.status !== 'rejected') {
          history.push({
            id: `earn_${i}`,
            date: r.completedAt,
            type: "earn",
            surveyType: r.type,
            amount: r.rewardPoints,
            description: r.title,
            status: r.status
          });
        }
      });

      redemptionsList.forEach((r, i) => {
        if (r.status !== 'rejected') {
          totalRedeemed += r.pointsCost;
        }
        if (r.status === 'pending') {
          pendingRedemptions += r.pointsCost;
        }
        history.push({
          id: `redeem_${r.id}`,
          date: r.createdAt,
          type: "redeem",
          amount: -r.pointsCost,
          description: `${r.provider} Gift Card (${r.amount})`,
          status: r.status,
          code: r.code
        });
      });

      const balance = lifetimeEarnings - totalRedeemed;

      res.json({
        balance,
        lifetimeEarnings,
        pending: pendingRedemptions,
        pendingPoints,
        history: history.sort((a, b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime())
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error loading wallet" });
    }
  });

  app.post("/api/redeem", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (!dbUser) return res.status(401).json({ error: "User not found" });
      if (dbUser.isBanned) return res.status(403).json({ error: "Your account has been banned." });

      const { provider, amount } = req.body;
      
      // Points calculation
      let pointsCost = 0;
      if (amount === 250) pointsCost = 2500;
      else if (amount === 500) pointsCost = 5000;
      else return res.status(400).json({ error: "Invalid amount" });

      // Validate balance
      const responses = await db.select({ points: surveys.rewardPoints, status: surveyResponses.status })
        .from(surveyResponses)
        .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
        .where(eq(surveyResponses.userId, dbUser.id));
      
      const redemptionsList = await db.select({ cost: redemptions.pointsCost, status: redemptions.status })
        .from(redemptions)
        .where(eq(redemptions.userId, dbUser.id));

      const earned = responses.reduce((acc, curr) => curr.status === 'approved' ? acc + curr.points : acc, 0);
      const spent = redemptionsList.reduce((acc, curr) => curr.status !== 'rejected' ? acc + curr.cost : acc, 0);
      const balance = earned - spent;

      if (balance < pointsCost) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      const newRedemption = await db.insert(redemptions).values({
        userId: dbUser.id,
        provider,
        amount,
        pointsCost,
        status: 'pending'
      }).returning();

      res.json({ success: true, redemption: newRedemption[0] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error processing redemption" });
    }
  });

  app.get("/api/admin/redemptions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const allRedemptions = await db.select({
        id: redemptions.id,
        provider: redemptions.provider,
        amount: redemptions.amount,
        pointsCost: redemptions.pointsCost,
        status: redemptions.status,
        code: redemptions.code,
        createdAt: redemptions.createdAt,
        userEmail: users.email
      })
      .from(redemptions)
      .innerJoin(users, eq(redemptions.userId, users.id))
      .orderBy(desc(redemptions.createdAt));

      res.json(allRedemptions);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching redemptions" });
    }
  });

  app.get("/api/admin/responses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const allResponses = await db.select({
        id: surveyResponses.id,
        surveyId: surveys.id,
        surveyTitle: surveys.title,
        rewardPoints: surveys.rewardPoints,
        userId: users.id,
        userEmail: users.email,
        responseData: surveyResponses.responseData,
        status: surveyResponses.status,
        completedAt: surveyResponses.completedAt
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .innerJoin(users, eq(surveyResponses.userId, users.id))
      .orderBy(desc(surveyResponses.completedAt));

      res.json(allResponses);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching responses" });
    }
  });

  app.put("/api/admin/responses/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const responseId = parseInt(req.params.id);
      const { status } = req.body;

      const updated = await db.update(surveyResponses)
        .set({ status })
        .where(eq(surveyResponses.id, responseId))
        .returning();
        
      res.json(updated[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error updating response status" });
    }
  });

  app.put("/api/admin/redemptions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const redemptionId = parseInt(req.params.id);
      const { status, code } = req.body;

      const updated = await db.update(redemptions)
        .set({ status, code, updatedAt: new Date() })
        .where(eq(redemptions.id, redemptionId))
        .returning();
        
      res.json(updated[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error updating redemption" });
    }
  });


  app.get("/api/admin/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  app.put("/api/admin/users/:id/ban", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const targetUserId = parseInt(req.params.id);
      const { isBanned } = req.body;

      const updated = await db.update(users)
        .set({ isBanned })
        .where(eq(users.id, targetUserId))
        .returning();
        
      res.json(updated[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error banning user" });
    }
  });

  app.put("/api/admin/users/:id/role", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const targetUserId = parseInt(req.params.id);
      const { role } = req.body;

      const updated = await db.update(users)
        .set({ role })
        .where(eq(users.id, targetUserId))
        .returning();
        
      res.json(updated[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error updating user role" });
    }
  });

  app.delete("/api/surveys/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const surveyId = parseInt(req.params.id);
      
      // Delete responses first
      await db.delete(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
      
      // Then delete survey
      await db.delete(surveys).where(eq(surveys.id, surveyId));
        
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error deleting survey" });
    }
  });

  app.get("/api/admin/analytics", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
      const totalSurveys = await db.select({ count: sql`count(*)` }).from(surveys);
      const totalResponses = await db.select({ count: sql`count(*)` }).from(surveyResponses);
      const totalRedemptions = await db.select({ count: sql`count(*)` }).from(redemptions);

      res.json({
        users: parseInt(totalUsers[0].count as string),
        surveys: parseInt(totalSurveys[0].count as string),
        responses: parseInt(totalResponses[0].count as string),
        redemptions: parseInt(totalRedemptions[0].count as string)
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching analytics" });
    }
  });

  // --- BRAND ROUTES ---
  app.get("/api/brand/surveys", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "brand") return res.status(403).json({ error: "Brand only" });

      const brandSurveys = await db.select({
        id: surveys.id,
        title: surveys.title,
        description: surveys.description,
        type: surveys.type,
        status: surveys.status,
        createdAt: surveys.createdAt,
        responseCount: sql<number>`count(${surveyResponses.id})`
      })
      .from(surveys)
      .leftJoin(surveyResponses, eq(surveys.id, surveyResponses.surveyId))
      .where(eq(surveys.brandId, dbUser.id))
      .groupBy(surveys.id)
      .orderBy(desc(surveys.createdAt));

      res.json(brandSurveys);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching surveys" });
    }
  });

  app.post("/api/brand/surveys", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "brand") return res.status(403).json({ error: "Brand only" });

      const { title, description, type, rewardPoints, estimatedCompletionTime, status, repeatable, eligibility, category, content } = req.body;

      const newSurvey = await db.insert(surveys).values({
        title,
        description,
        type,
        rewardPoints: parseInt(rewardPoints),
        estimatedCompletionTime: parseInt(estimatedCompletionTime),
        status,
        repeatable,
        eligibility,
        category,
        content,
        brandId: dbUser.id
      }).returning();

      if (newSurvey[0].status === 'active') {
        notifyUsersForSurvey(newSurvey[0]);
      }

      res.json(newSurvey[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error creating survey" });
    }
  });

  app.put("/api/brand/surveys/:id/status", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "brand") return res.status(403).json({ error: "Brand only" });

      const surveyId = parseInt(req.params.id);
      const { status } = req.body;

      const updated = await db.update(surveys)
        .set({ status })
        .where(and(eq(surveys.id, surveyId), eq(surveys.brandId, dbUser.id)))
        .returning();
        
      res.json(updated[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error updating survey status" });
    }
  });

  app.get("/api/brand/analytics", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "brand") return res.status(403).json({ error: "Brand only" });

      const totalSurveysResult = await db.select({ count: sql`count(*)` })
        .from(surveys)
        .where(eq(surveys.brandId, dbUser.id));
        
      const brandSurveys = await db.select({ id: surveys.id })
        .from(surveys)
        .where(eq(surveys.brandId, dbUser.id));
        
      const surveyIds = brandSurveys.map(s => s.id);
      let totalResponses = 0;
      
      if (surveyIds.length > 0) {
        const responsesResult = await db.select({ count: sql`count(*)` })
          .from(surveyResponses)
          .where(inArray(surveyResponses.surveyId, surveyIds));
        totalResponses = parseInt(responsesResult[0].count as string);
      }
      
      // Calculate a fake completion rate or just return generic
      const completionRate = surveyIds.length > 0 ? 85 : 0;
      
      // Mock recent activity for brand
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        recentActivity.push({
          date: d.toISOString(),
          count: Math.floor(Math.random() * (totalResponses > 0 ? 50 : 0))
        });
      }

      res.json({
        totalSurveys: parseInt(totalSurveysResult[0].count as string),
        totalResponses,
        completionRate,
        recentActivity
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching brand analytics" });
    }
  });

  app.get("/api/brand/surveys/:id/responses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (dbUser?.role !== "brand") return res.status(403).json({ error: "Brand only" });

      const surveyId = parseInt(req.params.id);
      
      // Verify owner
      const surveyCheck = await db.query.surveys.findFirst({
        where: and(eq(surveys.id, surveyId), eq(surveys.brandId, dbUser.id))
      });
      
      if (!surveyCheck) {
        return res.status(404).json({ error: "Survey not found" });
      }

      const responses = await db.select({
        id: surveyResponses.id,
        userId: surveyResponses.userId,
        status: surveyResponses.status,
        completedAt: surveyResponses.completedAt,
        responseData: surveyResponses.responseData
      })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId))
      .orderBy(desc(surveyResponses.completedAt));

      res.json(responses);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error fetching responses" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

