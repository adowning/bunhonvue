import { betLogTable, depositAndBonusLogTable, operatorTable, User, userBalanceTable } from "@my-app/db";

export type UserBalance = typeof userBalanceTable.$inferSelect;
export type UserBalanceInsert = typeof userBalanceTable.$inferInsert;
export type UserBalanceSelect = typeof userBalanceTable.$inferSelect;

export type UserWithBalance = User & { userBalance: UserBalance };

export type UserBonus = typeof depositAndBonusLogTable.$inferSelect;
export type UserBonusInsert = typeof depositAndBonusLogTable.$inferInsert;

export type BetLog = typeof betLogTable.$inferSelect;
export type BetLogInsert = typeof betLogTable.$inferInsert;

export type Operator = typeof operatorTable.$inferSelect;
export type OperatorInsert = typeof operatorTable.$inferInsert;
