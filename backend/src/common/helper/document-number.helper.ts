import { Op } from 'sequelize';

export class DocumentNumberHelper {
  static async generate(
    model: any,
    field: string,
    prefix: string,
  ): Promise<string> {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const prefixWithDate = `${prefix}-${year}${month}`;

    const lastRecord = await model.findOne({
      where: {
        [field]: {
          [Op.like]: `${prefixWithDate}%`,
        },
      },
      order: [[field, 'DESC']],
    });

    let next = 1;

    if (lastRecord?.[field]) {
      const parts = lastRecord[field].split('-');
      next = Number(parts[2]) + 1;
    }

    return `${prefixWithDate}-${String(next).padStart(4, '0')}`;
  }
}
