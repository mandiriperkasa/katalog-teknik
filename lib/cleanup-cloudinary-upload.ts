export async function cleanupCloudinaryUploads(
  publicIds: Array<string | null | undefined>,
  keepalive = false,
) {
  const uniqueIds = Array.from(
    new Set(
      publicIds
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (uniqueIds.length === 0) return;

  try {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicIds: uniqueIds,
      }),
      keepalive,
    });
  } catch (error) {
    console.error('Gagal membersihkan upload Cloudinary yang tidak terpakai:', error);
  }
}
