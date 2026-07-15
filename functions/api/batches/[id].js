// DELETE /api/batches/:id  -> hapus batch

export async function onRequestDelete(context) {
  const { env, params } = context;
  await env.DB.prepare("DELETE FROM batches WHERE id = ?").bind(params.id).run();
  return Response.json({ ok: true });
}
