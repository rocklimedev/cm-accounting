import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'expense_titles',
  timestamps: false,
})
export class ExpenseTitle extends Model<ExpenseTitle> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    unique: true,
    allowNull: false,
  })
  title: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive: boolean;
}
