import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  uuid,
  pgEnum,
  jsonb,
  index,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { HOUSE_ID } from "@my-app/shared";
export const BalanceChange = {
  depositAmount: integer().notNull(),
  realAmountBefore: integer(),
  realAmountAfter: integer(),
  depositWageringRequiredBefore: integer(),
  depositWageringRequiredAfter: integer(),

  bonusAwardedAmount: integer().notNull(),
  bonusBalanceBefore: integer().notNull(),
  bonusBalanceAfter: integer().notNull(),
  bonusWrRemainingBefore: integer().notNull(),
  bonusWrRemainingAfter: integer().notNull(),
};
/**
 * This is our local user table, separate from Supabase auth.
 * We link it to the Supabase auth user via a UUID.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // This UUID comes from supabase.auth.users.id
  authId: varchar("auth_id", { length: 256 }).unique().notNull(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const userBalanceTable = pgTable("user_balances", {
  id: uuid().primaryKey().notNull(),
  // .
  userId: uuid().notNull(),
  realBalance: integer().default(0).notNull(),
  bonusBalance: integer().default(0).notNull(),
  freeSpinsRemaining: integer().default(0).notNull(),
  depositWageringRemaining: integer().default(0).notNull(),
  bonusWageringRemaining: integer().default(0).notNull(),

  totalDepositedReal: integer().default(0).notNull(),
  totalDepositedBonus: integer().default(0).notNull(),
  totalWithdrawn: integer().default(0).notNull(),
  totalWagered: integer().default(0).notNull(),
  totalWon: integer().default(0).notNull(),
  totalBonusGranted: integer().default(0).notNull(),
  totalFreeSpinWins: integer().default(0).notNull(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const UserBalanceSelectSchema = createSelectSchema(userBalanceTable);
export const UserBalanceInsertSchema = createInsertSchema(userBalanceTable);
export const UserBalanceUpdateSchema = createUpdateSchema(userBalanceTable);
export type UserBalance = typeof userBalanceTable.$inferSelect;
export type UserBalanceInsert = typeof userBalanceTable.$inferInsert;
export type UserBalanceSelect = typeof userBalanceTable.$inferSelect;

export type UserWithBalance = User & { userBalance: UserBalance };

export const bonusStatusEnum = pgEnum("bonus_status_enum", [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
]);
export const depositOrBonusTypeEnum = pgEnum("deposit_or_bonus_type_enum", [
  "DEPOSIT_CASHAPP",
  "DEPOSIT_INSTORE_CASH",
  "DEPOSIT_INSTORE_CARD",
  "DEPOSIT_MATCH",
  "LONG_BONUS_DAY_1",
  "LONG_BONUS_DAY_2",
  "VIP_LEVEL_UP",
]);
export const depositAndBonusLogTable = pgTable("bonus_logs", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid().notNull(),
  cashierId: uuid(),
  operatorId: uuid().notNull().default(HOUSE_ID),
  gameName: text(),
  userBalanceTable: uuid().notNull(),
  depositOrBonus: depositOrBonusTypeEnum("status")
    .default("DEPOSIT_CASHAPP")
    .notNull(),
  ...BalanceChange,
  metaData: jsonb(),
  expiresAt: timestamp({ withTimezone: true, mode: "date" }),
  activatedAt: timestamp("activated_at", {
    precision: 3,
  }),
  completedAt: timestamp("completed_at", {
    precision: 3,
  }),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const UserBonusSelectSchema = createSelectSchema(
  depositAndBonusLogTable
);
export const UserBonusInsertSchema = createInsertSchema(
  depositAndBonusLogTable
);
export const UserBonusUpdateSchema = createUpdateSchema(
  depositAndBonusLogTable
);
export type UserBonus = typeof depositAndBonusLogTable.$inferSelect;
export type UserBonusInsert = typeof depositAndBonusLogTable.$inferInsert;

export const betStatusEnum = pgEnum("transaction_status_enum", [
  "NSF",
  "GAME_CHECK_FAILED",
  "COMPLETED",
  "CANCELLED_BY_USER",
  "CANCELLED_BY_SYSTEM",
  "SERVER_SHUTDOWN",

  "EXPIRED",
]);

export const betLogTable = pgTable(
  "bet_logs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid().notNull(),
    gameSessionId: uuid(),
    operatorId: uuid(),
    status: betStatusEnum().default("COMPLETED").notNull(),

    // --- THIS IS THE CHANGE ---
    // REMOVED: wagerAmount: integer("wager_amount"),
    wagerAmount: integer().notNull(), // ADDED
    winAmount: integer().notNull(), // ADDED
    // -------------------------
    ...BalanceChange,
    hit: boolean("is_hit").generatedAlwaysAs(
      sql`winAmount > wagerAmount` // The SQL expression
    ),
    gameId: uuid(),
    gameName: text(),
    jackpotContribution: integer(),
    vipPointsAdded: integer(),
    processingTime: integer(),
    metadata: jsonb(),
    affiliateId: uuid(),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).defaultNow(),
  },
  (t) => [
    index("transaction_log_user_id_index").on(t.userId),
    index("transaction_log_status_index").on(t.status),
    index("transaction_log_game_id_index").on(t.gameId),
  ]
);

export const BetLogSelectSchema = createSelectSchema(betLogTable);
export const BetLogInsertSchema = createInsertSchema(betLogTable);
export const BetLogUpdateSchema = createUpdateSchema(betLogTable);

export type BetLog = typeof betLogTable.$inferSelect;
export type BetLogInsert = typeof betLogTable.$inferInsert;

export const operatorTable = pgTable("operators", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  updatedBy: text().default("system").notNull(),
  version: integer().default(1).notNull(),
  balance: integer().default(100000).notNull(),
  slotsBalance: integer().default(100000).notNull(),
  arcadeBalance: integer().default(100000).notNull(),
  currentFloat: integer().default(0).notNull(),
  isActive: boolean().default(true).notNull(),
  name: text().notNull(),
  ownerId: text().default("system").notNull(),
  products: jsonb(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date()),
});
export const operatorsNameUnique = uniqueIndex("operators_name_unique").on(
  operatorTable.name
);

export const OperatorSelectSchema = createSelectSchema(operatorTable);
export const OperatorInsertSchema = createInsertSchema(operatorTable);
export const OperatorUpdateSchema = createUpdateSchema(operatorTable);
export type Operator = typeof operatorTable.$inferSelect;
export type OperatorInsert = typeof operatorTable.$inferInsert;

export const sessionStatusEnum = pgEnum("session_status_enum", [
  "ACTIVE",
  "COMPLETED",
  "EXPIRED",
  "ABANDONED",
  "TIMEOUT",
  "OTP_PENDING",
  "SHUTDOWN",
]);

const gameSessionTable = pgTable(
  "game_sessions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    isBot: boolean().default(false).notNull(),
    authSessionId: uuid(), // Will relate to sessionTable
    userId: uuid().notNull(),
    gameId: uuid().notNull(),
    gameName: text(),
    status: sessionStatusEnum("status").default("ACTIVE").notNull(),
    totalWagered: integer().default(0),
    totalWon: integer().default(0),
    totalBets: integer().default(0),
    gameSessionRtp: integer().default(0),
    playerStartingBalance: integer(),
    playerEndingBalance: integer(),
    // sessionId: uuid("session_id"),
    duration: integer().default(0),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("game_sessions_user_id_index").on(t.userId),
    index("game_sessions_status_index").on(t.status),
    // index("game_sessions_auth_session_index").on(t.authSessionId),
  ]
);

export const GameSessionSelectSchema = createSelectSchema(gameSessionTable);
export const GameSessionInsertSchema = createInsertSchema(gameSessionTable);
export const GameSessionUpdateSchema = createUpdateSchema(gameSessionTable);
export type GameSession = typeof gameSessionTable.$inferSelect;
export type GameSessionInsert = typeof gameSessionTable.$inferInsert;
