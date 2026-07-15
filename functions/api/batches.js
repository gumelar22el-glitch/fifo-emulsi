// GET  /api/batches   -> daftar semua batch (aktif + histori)
// POST /api/batches   -> tambah batch baru

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    "SELECT * FROM batches ORDER BY mulai ASC"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  const nama = (body.nama || "").trim();
  const mulai = Number(body.mulai);
  const shift = body.shift || null;

  if (!nama || !mulai) {
    return new Response(
      JSON.stringify({ error: "nama dan mulai wajib diisi" }),
      { status: 400 }
    );
  }

  const id = "b" + Date.now() + Math.floor(Math.random() * 1000);
  const created_at = Date.now();

  await env.DB.prepare(
    "INSERT INTO batches (id, nama, mulai, used, violation, shift, created_at) VALUES (?, ?, ?, 0, 0, ?, ?)"
  )
    .bind(id, nama, mulai, shift, created_at)
    .run();

  return Response.json({ id, nama, mulai, used: 0, shift, created_at });
}
