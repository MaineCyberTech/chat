import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

router.get("/workspaces/:workspaceId/emoji", async (req, res) => {
  const { data } = await req
    .supabase!.from("custom_emoji")
    .select("*")
    .eq("workspace_id", req.params.workspaceId as string)
    .order("name", { ascending: true });
  res.json({ emoji: data ?? [] });
});

router.post("/workspaces/:workspaceId/emoji", async (req, res) => {
  const { name, imageUrl } = req.body;
  if (!name || !imageUrl) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: "name and imageUrl required" } });
    return;
  }
  const { data, error } = await req
    .supabase!.from("custom_emoji")
    .insert({
      workspace_id: req.params.workspaceId as string,
      name: name.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
      image_url: imageUrl,
      created_by: req.userId,
    })
    .select("*")
    .single();
  if (error) {
    res.status(500).json({ error: { code: "CREATE_FAILED", message: error.message } });
    return;
  }
  res.status(201).json({ emoji: data });
});

router.delete("/emoji/:id", async (req, res) => {
  const { error } = await req
    .supabase!.from("custom_emoji")
    .delete()
    .eq("id", req.params.id as string);
  if (error) {
    res.status(500).json({ error: { code: "DELETE_FAILED", message: error.message } });
    return;
  }
  res.status(204).send();
});

export default router;
