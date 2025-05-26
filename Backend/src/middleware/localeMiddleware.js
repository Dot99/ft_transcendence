import { normalizeLang } from "../utils/normalizeLang.js";

fastify.addHook("preHandler", async (request, reply) => {
	const rawLang = request.query.lang || request.headers["accept-language"];
	request.lang = normalizeLang(rawLang);
});
