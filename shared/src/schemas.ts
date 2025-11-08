import { betLogTable, depositAndBonusLogTable, userBalanceTable } from "@my-app/db";
import { z } from "zod";

// This recreates what drizzle-zod would generate, but manually to avoid compatibility issues

// Schema for selecting a user (e.g., API responses)
export const selectUserSchema = z.object({
  id: z.number(),
  authId: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  createdAt: z.date()
});

// Schema for inserting a new user (e.g., create user endpoint)
export const UserInsertSchema = z.object({
  authId: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional()
});

// Type definitions that match drizzle-orm's infer types
export type SelectUser = {
  id: number;
  authId: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
};

export type InsertUser = {
  authId: string;
  email: string;
  displayName?: string | null;
};

// User Balance schemas - manually created to avoid drizzle-zod references
export const UserBalanceSelectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  realBalance: z.number().default(0),
  bonusBalance: z.number().default(0),
  freeSpinsRemaining: z.number().default(0),
  depositWageringRemaining: z.number().default(0),
  bonusWageringRemaining: z.number().default(0),
  totalDepositedReal: z.number().default(0),
  totalDepositedBonus: z.number().default(0),
  totalWithdrawn: z.number().default(0),
  totalWagered: z.number().default(0),
  totalWon: z.number().default(0),
  totalBonusGranted: z.number().default(0),
  totalFreeSpinWins: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserBalanceInsertSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  realBalance: z.number().default(0),
  bonusBalance: z.number().default(0),
  freeSpinsRemaining: z.number().default(0),
  depositWageringRemaining: z.number().default(0),
  bonusWageringRemaining: z.number().default(0),
  totalDepositedReal: z.number().default(0),
  totalDepositedBonus: z.number().default(0),
  totalWithdrawn: z.number().default(0),
  totalWagered: z.number().default(0),
  totalWon: z.number().default(0),
  totalBonusGranted: z.number().default(0),
  totalFreeSpinWins: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const UserBalanceUpdateSchema = z.object({
  realBalance: z.number().optional(),
  bonusBalance: z.number().optional(),
  freeSpinsRemaining: z.number().optional(),
  depositWageringRemaining: z.number().optional(),
  bonusWageringRemaining: z.number().optional(),
  totalDepositedReal: z.number().optional(),
  totalDepositedBonus: z.number().optional(),
  totalWithdrawn: z.number().optional(),
  totalWagered: z.number().optional(),
  totalWon: z.number().optional(),
  totalBonusGranted: z.number().optional(),
  totalFreeSpinWins: z.number().optional(),
  updatedAt: z.date().optional()
});

// User Bonus schemas - manually created to avoid drizzle-zod references
export const UserBonusSelectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  cashierId: z.string().uuid().nullable(),
  operatorId: z.string().uuid(),
  gameName: z.string().nullable(),
  userBalanceTable: z.string().uuid(),
  depositOrBonus: z.enum([
    "DEPOSIT_CASHAPP",
    "DEPOSIT_INSTORE_CASH",
    "DEPOSIT_INSTORE_CARD",
    "DEPOSIT_MATCH",
    "LONG_BONUS_DAY_1",
    "LONG_BONUS_DAY_2",
    "VIP_LEVEL_UP"
  ]),
  depositAmount: z.number(),
  realAmountBefore: z.number().nullable(),
  realAmountAfter: z.number().nullable(),
  depositWageringRequiredBefore: z.number().nullable(),
  depositWageringRequiredAfter: z.number().nullable(),
  bonusAwardedAmount: z.number(),
  bonusBalanceBefore: z.number(),
  bonusBalanceAfter: z.number(),
  bonusWrRemainingBefore: z.number(),
  bonusWrRemainingAfter: z.number(),
  metaData: z.record(z.any()).nullable(),
  expiresAt: z.date().nullable(),
  activatedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date()
});

export const UserBonusInsertSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  cashierId: z.string().uuid().nullable(),
  operatorId: z.string().uuid().default("3lk3j80f33"),
  gameName: z.string().nullable(),
  userBalanceTable: z.string().uuid(),
  depositOrBonus: z.enum([
    "DEPOSIT_CASHAPP",
    "DEPOSIT_INSTORE_CASH",
    "DEPOSIT_INSTORE_CARD",
    "DEPOSIT_MATCH",
    "LONG_BONUS_DAY_1",
    "LONG_BONUS_DAY_2",
    "VIP_LEVEL_UP"
  ]).default("DEPOSIT_CASHAPP"),
  depositAmount: z.number(),
  realAmountBefore: z.number().nullable(),
  realAmountAfter: z.number().nullable(),
  depositWageringRequiredBefore: z.number().nullable(),
  depositWageringRequiredAfter: z.number().nullable(),
  bonusAwardedAmount: z.number(),
  bonusBalanceBefore: z.number(),
  bonusBalanceAfter: z.number(),
  bonusWrRemainingBefore: z.number(),
  bonusWrRemainingAfter: z.number(),
  metaData: z.record(z.any()).nullable(),
  expiresAt: z.date().nullable(),
  activatedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date().optional()
});

export const UserBonusUpdateSchema = z.object({
  cashierId: z.string().uuid().nullable().optional(),
  gameName: z.string().nullable().optional(),
  depositAmount: z.number().optional(),
  realAmountBefore: z.number().nullable().optional(),
  realAmountAfter: z.number().nullable().optional(),
  depositWageringRequiredBefore: z.number().nullable().optional(),
  depositWageringRequiredAfter: z.number().nullable().optional(),
  bonusAwardedAmount: z.number().optional(),
  bonusBalanceBefore: z.number().optional(),
  bonusBalanceAfter: z.number().optional(),
  bonusWrRemainingBefore: z.number().optional(),
  bonusWrRemainingAfter: z.number().optional(),
  metaData: z.record(z.any()).nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  activatedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional()
});

// Bet Log schemas - manually created to avoid drizzle-zod references
export const BetLogSelectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  gameSessionId: z.string().uuid().nullable(),
  operatorId: z.string().uuid().nullable(),
  status: z.enum([
    "NSF",
    "GAME_CHECK_FAILED",
    "COMPLETED",
    "CANCELLED_BY_USER",
    "CANCELLED_BY_SYSTEM",
    "SERVER_SHUTDOWN",
    "EXPIRED"
  ]).default("COMPLETED"),
  wagerAmount: z.number(),
  winAmount: z.number(),
  depositAmount: z.number(),
  realAmountBefore: z.number().nullable(),
  realAmountAfter: z.number().nullable(),
  depositWageringRequiredBefore: z.number().nullable(),
  depositWageringRequiredAfter: z.number().nullable(),
  bonusAwardedAmount: z.number(),
  bonusBalanceBefore: z.number(),
  bonusBalanceAfter: z.number(),
  bonusWrRemainingBefore: z.number(),
  bonusWrRemainingAfter: z.number(),
  hit: z.boolean(),
  gameId: z.string().uuid().nullable(),
  gameName: z.string().nullable(),
  jackpotContribution: z.number().nullable(),
  vipPointsAdded: z.number().nullable(),
  processingTime: z.number().nullable(),
  metadata: z.record(z.any()).nullable(),
  affiliateId: z.string().uuid().nullable(),
  createdAt: z.date()
});

export const BetLogInsertSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  gameSessionId: z.string().uuid().nullable(),
  operatorId: z.string().uuid().nullable(),
  status: z.enum([
    "NSF",
    "GAME_CHECK_FAILED",
    "COMPLETED",
    "CANCELLED_BY_USER",
    "CANCELLED_BY_SYSTEM",
    "SERVER_SHUTDOWN",
    "EXPIRED"
  ]).default("COMPLETED"),
  wagerAmount: z.number(),
  winAmount: z.number(),
  depositAmount: z.number(),
  realAmountBefore: z.number().nullable(),
  realAmountAfter: z.number().nullable(),
  depositWageringRequiredBefore: z.number().nullable(),
  depositWageringRequiredAfter: z.number().nullable(),
  bonusAwardedAmount: z.number(),
  bonusBalanceBefore: z.number(),
  bonusBalanceAfter: z.number(),
  bonusWrRemainingBefore: z.number(),
  bonusWrRemainingAfter: z.number(),
  hit: z.boolean().optional(),
  gameId: z.string().uuid().nullable(),
  gameName: z.string().nullable(),
  jackpotContribution: z.number().nullable(),
  vipPointsAdded: z.number().nullable(),
  processingTime: z.number().nullable(),
  metadata: z.record(z.any()).nullable(),
  affiliateId: z.string().uuid().nullable(),
  createdAt: z.date().optional()
});

export const BetLogUpdateSchema = z.object({
  gameSessionId: z.string().uuid().nullable().optional(),
  operatorId: z.string().uuid().nullable().optional(),
  status: z.enum([
    "NSF",
    "GAME_CHECK_FAILED",
    "COMPLETED",
    "CANCELLED_BY_USER",
    "CANCELLED_BY_SYSTEM",
    "SERVER_SHUTDOWN",
    "EXPIRED"
  ]).optional(),
  wagerAmount: z.number().optional(),
  winAmount: z.number().optional(),
  depositAmount: z.number().optional(),
  realAmountBefore: z.number().nullable().optional(),
  realAmountAfter: z.number().nullable().optional(),
  depositWageringRequiredBefore: z.number().nullable().optional(),
  depositWageringRequiredAfter: z.number().nullable().optional(),
  bonusAwardedAmount: z.number().optional(),
  bonusBalanceBefore: z.number().optional(),
  bonusBalanceAfter: z.number().optional(),
  bonusWrRemainingBefore: z.number().optional(),
  bonusWrRemainingAfter: z.number().optional(),
  gameId: z.string().uuid().nullable().optional(),
  gameName: z.string().nullable().optional(),
  jackpotContribution: z.number().nullable().optional(),
  vipPointsAdded: z.number().nullable().optional(),
  processingTime: z.number().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  affiliateId: z.string().uuid().nullable().optional()
});

