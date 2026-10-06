// Ridimensiona una foto nel browser prima dell'invio: meno traffico e nessun problema coi limiti di upload del server

export async function ridimensiona(file: File, latoMax: number, qualita = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scala = Math.min(1, latoMax / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * scala))
  const h = Math.max(1, Math.round(bmp.height * scala))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Immagine non elaborabile')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return new Promise((ok, ko) => canvas.toBlob(b => (b ? ok(b) : ko(new Error('Immagine non elaborabile'))), 'image/jpeg', qualita))
}

// Foto del profilo: quadrata al centro, 480 px
export async function ritagliaQuadrata(file: File, lato = 480, qualita = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const s = Math.min(bmp.width, bmp.height)
  const canvas = document.createElement('canvas')
  canvas.width = lato
  canvas.height = lato
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Immagine non elaborabile')
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, lato, lato)
  bmp.close()
  return new Promise((ok, ko) => canvas.toBlob(b => (b ? ok(b) : ko(new Error('Immagine non elaborabile'))), 'image/jpeg', qualita))
}

export const eImmagine = (f: { type: string; name?: string }) =>
  f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name ?? '')
