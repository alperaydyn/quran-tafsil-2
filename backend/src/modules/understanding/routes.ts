import type { FastifyPluginAsync } from "fastify";
import { ok, fail } from "../../utils/response.js";
import { createSessionSchema, askQuestionSchema } from "./dto.js";
import {
  createSession,
  listSessions,
  getSessionDetail,
  askQuestion,
} from "./service.js";

const DEFAULT_GUEST_USER_ID = "00000000-0000-0000-0000-000000000001";

export const understandingRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/v1/anlama-oturumlari
  app.get("/anlama-oturumlari", async (request, reply) => {
    const userId = request.user?.sub || DEFAULT_GUEST_USER_ID;
    const data = await listSessions(userId);
    return reply.send(ok(data));
  });

  // GET /api/v1/anlama-oturumlari/:id
  app.get<{ Params: { id: string } }>("/anlama-oturumlari/:id", async (request, reply) => {
    const userId = request.user?.sub || DEFAULT_GUEST_USER_ID;
    const data = await getSessionDetail(userId, request.params.id);

    if (!data) {
      return reply.status(404).send(fail("NOT_FOUND", "Anlama oturumu bulunamadı"));
    }

    return reply.send(ok(data));
  });

  // POST /api/v1/anlama-oturumlari
  app.post("/anlama-oturumlari", async (request, reply) => {
    const parseRes = createSessionSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Geçersiz oturum girdisi"));
    }

    const userId = request.user?.sub || DEFAULT_GUEST_USER_ID;
    const data = await createSession(userId, parseRes.data);
    return reply.status(201).send(ok(data));
  });

  // POST /api/v1/anlama-oturumlari/:id/soru
  app.post<{ Params: { id: string } }>("/anlama-oturumlari/:id/soru", async (request, reply) => {
    const parseRes = askQuestionSchema.safeParse(request.body);
    if (!parseRes.success) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Geçersiz soru"));
    }

    const userId = request.user?.sub || DEFAULT_GUEST_USER_ID;
    const data = await askQuestion(userId, request.params.id, parseRes.data);

    if (!data) {
      return reply.status(404).send(fail("NOT_FOUND", "Anlama oturumu bulunamadı"));
    }

    return reply.send(ok(data));
  });
};
