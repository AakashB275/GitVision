import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { analyzeService } from "../services/analyzeService";
import { userService } from "../services/userService";

export async function analyzeController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req); // already verified by middleware, just extract
  const { url } = req.body;
  const { repoOwner, repoName } = res.locals;

  const user = await userService.getOrCreateUser(clerkId!);

  const graph = await analyzeService.analyze({
    userId: user.id,
    repoUrl: url,
    repoOwner,
    repoName,
  });

  return res.json(graph);
}