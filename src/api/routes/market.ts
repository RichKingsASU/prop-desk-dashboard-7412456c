import { Router } from "express";
import { getQuotes, listBars1m, listNews, listOptionsSnapshots } from "@/db/repositories/market_repo";

function parseSymbols(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function marketRouter() {
  const router = Router();

  router.get("/market/quotes", async (req, res) => {
    const symbols = parseSymbols(typeof req.query.symbols === "string" ? req.query.symbols : undefined);
    const quotes = await getQuotes(symbols);
    return res.status(200).json({ quotes });
  });

  router.get("/market/news", async (req, res) => {
    const symbols = parseSymbols(typeof req.query.symbols === "string" ? req.query.symbols : undefined);
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const news = await listNews({
      symbols: symbols.length > 0 ? symbols : undefined,
      limit: Number.isFinite(limit ?? NaN) ? limit : undefined,
    });
    return res.status(200).json({ news });
  });

  router.get("/market/options/snapshots", async (req, res) => {
    const symbol = typeof req.query.symbol === "string" ? req.query.symbol : undefined;
    const expiry = typeof req.query.expiry === "string" ? req.query.expiry : undefined;
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

    const snapshots = await listOptionsSnapshots({
      symbol,
      expiry,
      limit: Number.isFinite(limit ?? NaN) ? limit : undefined,
    });
    return res.status(200).json({ snapshots });
  });

  router.get("/market/bars/1m", async (req, res) => {
    const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
    const start = typeof req.query.start === "string" ? req.query.start : undefined;
    const end = typeof req.query.end === "string" ? req.query.end : undefined;
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

    const bars = symbol
      ? await listBars1m({ symbol, start, end, limit: Number.isFinite(limit ?? NaN) ? limit : undefined })
      : [];

    return res.status(200).json({ bars });
  });

  return router;
}

