import { z } from 'zod';

export const galleryPayloadSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul gallery wajib diisi.').max(180),
    category: z.string().trim().min(1, 'Kategori gallery wajib diisi.').max(120),
    location: z.string().trim().max(240).optional().default(''),
    description: z.string().trim().min(1, 'Detail pekerjaan wajib diisi.').max(8000),
    mediaType: z.enum(['image', 'youtube']),
    youtubeVideoId: z.string().trim().max(32).nullable().optional(),
    imageUrl: z.string().trim().url().max(2000).nullable().optional(),
    imagePublicId: z.string().trim().max(500).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .superRefine((value, context) => {
    if (value.mediaType === 'image' && !value.imageUrl) {
      context.addIssue({
        code: 'custom',
        path: ['imageUrl'],
        message: 'Foto gallery wajib tersedia.',
      });
    }

    if (
      value.mediaType === 'youtube' &&
      (!value.youtubeVideoId || !/^[A-Za-z0-9_-]{6,20}$/.test(value.youtubeVideoId))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['youtubeVideoId'],
        message: 'ID video YouTube tidak valid.',
      });
    }
  });
