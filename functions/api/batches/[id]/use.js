// POST /api/batches/:id/use  -> tandai batch sudah dipakai, cek pelanggaran FIFO

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const id = params.id;

  const target = await env.DB.prepare("SELECT * FROM batches WHERE id = ?")
    .bind(id)
    .first();

  if (!target) {
    return new Response(JSON.stringify({ error: "batch tidak ditemukan" }), {
      status: 404,
    });
  }
  if (target.used) {
    return new Response(JSON.stringify({ error: "batch sudah dipakai" }), {
      status: 400,
    });
  }

  // cek apakah ada batch lain yang belum dipakai dan lebih tua (mulai lebih awal)
  const older = await env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM batches WHERE used = 0 AND mulai < ? AND id != ?"
  )
    .bind(target.mulai, id)
    .first();

  const violation = older.cnt > 0 ? 1 : 0;

  // body opsional: { force: true } dikirim frontend setelah operator konfirmasi peringatan
  let force = false;
  try {
    const body = await request.json();
    force = !!body.force;
  } catch (e) {
    // tidak ada body, tidak apa
  }

  if (violation && !force) {
    return new Response(
      JSON.stringify({
        violation: true,
        needConfirm: true,
        message:
          "Ada bahan lain yang lebih dulu resting dan belum dipakai. Ini melanggar FIFO.",
      }),
      { status: 409 }
    );
  }

  const used_at = Date.now();
  await env.DB.prepare(
    "UPDATE batches SET used = 1, used_at = ?, violation = ? WHERE id = ?"
  )
    .bind(used_at, violation, id)
    .run();

  return Response.json({ ok: true, used_at, violation: !!violation });
}
