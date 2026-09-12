import type { FastifyPluginAsync } from "fastify";
import { SyncService } from "./service.js";
import { SyncPushSchema, SyncPullSchema } from "./dto.js";

export const syncRoutes: FastifyPluginAsync = async (fastify) => {
  const syncService = new SyncService();

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

    const result = await syncService.pushSyncData(parseResult.data);
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

    const result = await syncService.pullSyncData(parseResult.data);
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
    const status = await syncService.getSyncStatus(query?.user_id);
    return reply.send({
      success: true,
      data: status
    });
  });
};
