import type { FastifyPluginAsync } from "fastify";
import { SyncService } from "./service.js";
import { SyncPushSchema, SyncPullSchema } from "./dto.js";

export const syncRoutes: FastifyPluginAsync = async (fastify) => {
  const syncService = new SyncService();

  const extractUserId = async (request: any, fallbackUserId?: string): Promise<string | undefined> => {
    if (request.headers.authorization) {
      try {
        const decoded = (await request.jwtVerify()) as { sub: string; authProvider?: string } | undefined;
        if (decoded?.sub) return decoded.sub;
      } catch {
        // Token çözülemezse fallback'e devam et
      }
    }
    return fallbackUserId;
  };

  fastify.post("/api/v1/sync/push", async (request, reply) => {
    const parseResult = SyncPushSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz senkronizasyon verisi",
          details: parseResult.error.format()
        }
      });
    }

    const data = parseResult.data;
    data.user_id = await extractUserId(request, data.user_id);

    const result = await syncService.pushSyncData(data);
    return reply.send({
      success: true,
      data: result
    });
  });

  fastify.post("/api/v1/sync/pull", async (request, reply) => {
    const parseResult = SyncPullSchema.safeParse(request.body || {});
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz senkronizasyon sorgusu",
          details: parseResult.error.format()
        }
      });
    }

    const data = parseResult.data;
    data.user_id = await extractUserId(request, data.user_id);

    const result = await syncService.pullSyncData(data);
    return reply.send({
      success: true,
      data: result.data,
      meta: {
        synced_at: result.synced_at,
        user_id: result.user_id
      }
    });
  });

  fastify.get("/api/v1/sync/status", async (request, reply) => {
    const query = request.query as { user_id?: string };
    const effectiveUserId = await extractUserId(request, query?.user_id);
    const status = await syncService.getSyncStatus(effectiveUserId);
    return reply.send({
      success: true,
      data: status
    });
  });

  fastify.get("/api/v1/sync/timeline", async (request, reply) => {
    const query = request.query as { user_id?: string };
    const timeline = await syncService.getReadingTimeline(query?.user_id);
    return reply.send({
      success: true,
      data: timeline
    });
  });

  fastify.get("/api/v1/sync/reading-history", async (request, reply) => {
    const query = request.query as { user_id?: string };
    const timeline = await syncService.getReadingTimeline(query?.user_id);
    return reply.send({
      success: true,
      data: timeline
    });
  });
};
