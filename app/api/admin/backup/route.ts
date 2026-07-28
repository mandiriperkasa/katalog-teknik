import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDatabase } from '@/lib/database/neon';
import { requireSuperAdmin } from '@/lib/require-super-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKUP_TABLES = [
  'products',
  'product_promotions',
  'gallery',
  'settings',
  'social_media',
  'partners',
] as const;
const MAX_BACKUP_FILE_SIZE = 25 * 1024 * 1024;

type BackupTable = (typeof BACKUP_TABLES)[number];

type BackupFile = {
  format: 'katalog-teknik-backup';
  version: 1;
  createdAt: string;
  tables: Partial<Record<BackupTable, unknown[]>>;
};

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BackupFile>;
  return (
    candidate.format === 'katalog-teknik-backup' &&
    candidate.version === 1 &&
    !!candidate.tables &&
    typeof candidate.tables === 'object'
  );
}

async function existingTables() {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY(${BACKUP_TABLES as unknown as string[]})
  `) as unknown as Array<{ table_name: BackupTable }>;

  return new Set(rows.map((row) => row.table_name));
}

function createWorkbook(backup: BackupFile) {
  const workbook = XLSX.utils.book_new();

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ['BACKUP KATALOG TEKNIK'],
    ['Dibuat pada', backup.createdAt],
    ['Format', backup.format],
    ['Versi', backup.version],
    [],
    ['Petunjuk'],
    ['File ini dapat dibuka dan diperiksa di Microsoft Excel.'],
    ['Jangan menghapus atau mengubah sheet _SYSTEM_BACKUP jika file akan dipakai untuk restore.'],
    ['Akun admin dan password tidak disertakan.'],
  ]);
  infoSheet['!cols'] = [{ wch: 24 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'INFORMASI');

  for (const table of BACKUP_TABLES) {
    const rows = backup.tables[table] ?? [];
    const sheet =
      rows.length > 0
        ? XLSX.utils.json_to_sheet(rows as Record<string, unknown>[], {
            dateNF: 'yyyy-mm-dd hh:mm:ss',
          })
        : XLSX.utils.aoa_to_sheet([['Tidak ada data']]);

    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const widths: Array<{ wch: number }> = [];
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      let width = 12;
      for (let row = range.s.r; row <= Math.min(range.e.r, 100); row += 1) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
        const length = cell?.v == null ? 0 : String(cell.v).length;
        width = Math.max(width, Math.min(length + 2, 45));
      }
      widths.push({ wch: width });
    }
    sheet['!cols'] = widths;
    sheet['!autofilter'] = { ref: sheet['!ref'] || 'A1:A1' };
    XLSX.utils.book_append_sheet(workbook, sheet, table.toUpperCase());
  }

  // Sheet internal berisi data JSON asli agar restore tidak kehilangan tipe data.
  const json = JSON.stringify(backup);
  const chunkSize = 30000;
  const chunks = Array.from({ length: Math.ceil(json.length / chunkSize) }, (_, index) => [
    index + 1,
    json.slice(index * chunkSize, (index + 1) * chunkSize),
  ]);
  const systemSheet = XLSX.utils.aoa_to_sheet([['Urutan', 'Data'], ...chunks]);
  systemSheet['!cols'] = [{ wch: 10 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, systemSheet, '_SYSTEM_BACKUP');

  workbook.Workbook = workbook.Workbook || {};
  workbook.Workbook.Sheets = workbook.SheetNames.map((name) => ({
    Hidden: name === '_SYSTEM_BACKUP' ? 2 : 0,
  }));

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });
}

function readBackupFromWorkbook(buffer: Buffer): BackupFile {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets._SYSTEM_BACKUP;
  if (!sheet) throw new Error('Sheet sistem backup tidak ditemukan.');

  const rows = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, {
    header: 1,
    raw: false,
    blankrows: false,
  });

  const json = rows
    .slice(1)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map((row) => String(row[1] ?? ''))
    .join('');

  const parsed: unknown = JSON.parse(json);
  if (!isBackupFile(parsed)) throw new Error('Format backup Excel tidak valid.');
  return parsed;
}

export async function GET() {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ message: 'Akses hanya untuk super admin.' }, { status: 403 });
  }

  try {
    const sql = getDatabase();
    const found = await existingTables();
    const tables: BackupFile['tables'] = {};

    for (const table of BACKUP_TABLES) {
      if (!found.has(table)) continue;
      const rows = await sql.query(`SELECT * FROM "${table}" ORDER BY 1 ASC`, []);
      tables[table] = rows as unknown[];
    }

    const backup: BackupFile = {
      format: 'katalog-teknik-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      tables,
    };

    const file = createWorkbook(backup);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="katalog-teknik-backup-${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Gagal membuat backup Excel:', error);
    return NextResponse.json({ message: 'Gagal membuat backup database.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ message: 'Akses hanya untuk super admin.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'File backup Excel belum dipilih.' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ message: 'File harus berformat .xlsx.' }, { status: 400 });
    }
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      return NextResponse.json({ message: 'Ukuran file backup maksimal 25MB.' }, { status: 400 });
    }

    let body: BackupFile;

    try {
      body = readBackupFromWorkbook(Buffer.from(await file.arrayBuffer()));
    } catch {
      return NextResponse.json(
        {
          message: 'Format backup Excel tidak valid atau sheet sistem tidak ditemukan.',
        },
        {
          status: 400,
        },
      );
    }

    const sql = getDatabase();
    const found = await existingTables();
    const restored: Record<string, number> = {};
    const operations = [];

    for (const table of BACKUP_TABLES) {
      const rows = body.tables[table];
      if (!found.has(table) || !Array.isArray(rows)) continue;

      const json = JSON.stringify(rows);
      operations.push(sql.query(`DELETE FROM "${table}"`, []));
      if (rows.length > 0) {
        operations.push(
          sql.query(
            `INSERT INTO "${table}" SELECT * FROM json_populate_recordset(NULL::"${table}", $1::json)`,
            [json],
          ),
        );
      }

      restored[table] = rows.length;
    }

    if (found.has('products')) {
      operations.push(
        sql.query(
          `SELECT setval(
            pg_get_serial_sequence('products', 'id'),
            COALESCE((SELECT MAX(id) FROM products), 1),
            (SELECT COUNT(*) > 0 FROM products)
          )`,
          [],
        ),
      );
    }

    if (found.has('partners')) {
      operations.push(
        sql.query(
          `SELECT setval(
            pg_get_serial_sequence('partners', 'id'),
            COALESCE((SELECT MAX(id) FROM partners), 1),
            (SELECT COUNT(*) > 0 FROM partners)
          )`,
          [],
        ),
      );
    }

    await sql.transaction(operations);

    return NextResponse.json({ success: true, restored });
  } catch (error) {
    console.error('Gagal restore backup Excel:', error);
    return NextResponse.json(
      { message: 'Restore gagal. Pastikan file berasal dari fitur backup website ini.' },
      { status: 500 },
    );
  }
}
