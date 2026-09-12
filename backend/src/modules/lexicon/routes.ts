import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok, fail } from "../../utils/response.js";
import { getKelime, getKokTurevleri } from "./service.js";

const idParam = z.object({ id: z.coerce.number().int().min(1) });

export async function lexiconRoutes(app: FastifyInstance) {
  // BE-018
  app.get("/kelimeler/:id", async (request, reply) => {
    const parsed = idParam.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Geçersiz kelime id", parsed.error.flatten()));
    }
    const { data, cached } = await getKelime(parsed.data.id);
    if (!data) return reply.status(404).send(fail("KELIME_NOT_FOUND", "Kelime bulunamadı"));
    return reply.send(ok(data, { cached }));
  });

  // BE-019
  app.get("/kokler/:id/turevler", async (request, reply) => {
    const parsed = idParam.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send(fail("VALIDATION_ERROR", "Geçersiz kök id", parsed.error.flatten()));
    }
    const { data, cached } = await getKokTurevleri(parsed.data.id);
    if (!data) return reply.status(404).send(fail("KOK_NOT_FOUND", "Kök bulunamadı"));
    return reply.send(ok(data, { cached }));
  });
}
