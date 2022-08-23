import { Context, Next } from '@nocobase/actions';
import xlsx from 'node-xlsx';

export async function downloadXlsxTemplate(ctx: Context, next: Next) {
  let { columns, explain, title } = ctx.action.params;
  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }
  const header = columns?.map((column) => column.defaultTitle);

  ctx.body = xlsx.build([
    {
      name: title,
      data: [header, [explain]],
    },
  ]);

  ctx.set({
    'Content-Type': 'application/octet-stream',
    // to avoid "invalid character" error in header (RFC)
    'Content-Disposition': `attachment; filename=${encodeURI(title)}.xlsx`,
  });

  await next();
}
