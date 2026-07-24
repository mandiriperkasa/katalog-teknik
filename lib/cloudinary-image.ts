type CloudinaryImageOptions = {
  width?: number;
};

export function getOptimizedCloudinaryUrl(
  source: string | null | undefined,
  options: CloudinaryImageOptions = {},
) {
  const value = source?.trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    if (url.hostname !== 'res.cloudinary.com') return value;

    const uploadMarker = '/upload/';
    if (!url.pathname.includes(uploadMarker)) return value;

    const transformations = ['f_auto', 'q_auto'];
    if (options.width && Number.isFinite(options.width)) {
      transformations.push(`w_${Math.max(1, Math.round(options.width))}`, 'c_limit');
    }

    url.pathname = url.pathname.replace(
      uploadMarker,
      `${uploadMarker}${transformations.join(',')}/`,
    );

    return url.toString();
  } catch {
    return value;
  }
}

export function isCloudinaryUrl(source: string | null | undefined) {
  if (!source) return false;

  try {
    return new URL(source).hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}
