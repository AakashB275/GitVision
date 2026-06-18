import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { userService } from "../services/userService";

export async function userController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req); // already verified by middleware, just extract

  const user = await userService.getOrCreateUser(clerkId!);

  return res.json(user);
}