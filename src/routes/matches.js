import e, { Router } from "express";
import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {matches} from "../db/schema.js";
import {db} from "../db/db.js";
import {getMatchStatus} from "../utils/match-status.js";
import { desc } from "drizzle-orm"

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if(!parsed.success) {
        return res.status(400).json({ message: "Invalid query,", details: parsed.error.issues });
    }

    // show limit when fetch
    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT)

    try {
        const data = await db
            .select()
            .from(matches)
            // show new created data
            .orderBy((desc(matches.createdAt)))
            .limit(limit)

        res.json({ data })
    } catch(e) {
        res.status(500).json({ error: "Failed to list match" }) ;
    }
    // res.status(200).json({ message: "Matches list"})
})

matchRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if(!parsed.success) {
        return res.status(400).json({ message: "Invalid payload,", details: JSON.parsed.error.issues });
    }

    const { data : { startTime, endTime, homeScore, awayStatus }} = parsed;

    try {
    // insert new match in to database
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayStatus ?? 0,
            state: getMatchStatus(startTime, endTime)
        }).returning();

        res.status(201).json({ data: event })
    } catch {
        res.status(500).json({ error: "Failed to create match", details: JSON.stringify(e)})
    }
})