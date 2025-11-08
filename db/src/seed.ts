// db/src/seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

// --- CONFIGURATION ---
const OPERATOR_COUNT = 5;
const USERS_PER_OPERATOR = 50;
const MAX_DEPOSITS_PER_USER = 15;
const TOTAL_GAMEPLAY_SESSIONS = 20;
const WAGERING_REQUIREMENT_MULTIPLIER = 30;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// --- UTILITY FUNCTIONS ---
async function cleanDatabase() {
    console.log('🧹 Clearing existing data...');
    await db.delete(schema.betLogTable);
    await db.delete(schema.gameSessionTable);
    await db.delete(schema.depositAndBonusLogTable);
    await db.delete(schema.userBalanceTable);
    await db.delete(schema.users);
    await db.delete(schema.operatorTable);
    console.log('🗑️ Database cleared.');
}
async function createOperators(count: number): Promise<schema.Operator[]> {
    console.log(`🏭 Creating ${count} operators...`);
    const operators: schema.Operator[] = [];
    for (let i = 0; i < count; i++) {
        const [operator] = await db.insert(schema.operatorTable).values({
        name: faker.company.name(),
        balance: faker.number.int({ min: 10000000, max: 50000000 }),
        slotsBalance: faker.number.int({ min: 5000000, max: 25000000 }),
        arcadeBalance: faker.number.int({ min: 5000000, max: 25000000 }),
        }).returning();
        operators.push(operator);
    }
    console.log(`✅ Created ${operators.length} operators.`);
    return operators;
}
function calculateWinAmount(wagerAmount: number): number {
    const random = Math.random();
    const payouts = {
        jackpot: { threshold: 0.001, multiplier: [100, 250] },
        largeWin: { threshold: 0.005, multiplier: [20, 50] },
        mediumWin: { threshold: 0.035, multiplier: [5, 15] },
        smallWin: { threshold: 0.15, multiplier: [1, 3] },
    };
    if (random < payouts.jackpot.threshold) return wagerAmount * faker.number.int({ min: payouts.jackpot.multiplier[0], max: payouts.jackpot.multiplier[1] });
    if (random < payouts.largeWin.threshold) return wagerAmount * faker.number.int({ min: payouts.largeWin.multiplier[0], max: payouts.largeWin.multiplier[1] });
    if (random < payouts.smallWin.threshold) return wagerAmount * faker.number.int({ min: payouts.mediumWin.multiplier[0], max: payouts.mediumWin.multiplier[1] });
    if (random < payouts.smallWin.threshold) return wagerAmount * faker.number.int({ min: payouts.smallWin.multiplier[0], max: payouts.smallWin.multiplier[1] });
    return 0;
}

class UserState {
    public wageringRequirementRemaining: number = 0;
    public hasMadeWithdrawal: boolean = false;
    public depositCount: number = 0;
}

// --- SIMULATION LOGIC ---

async function triggerDeposit(userState: UserState, currentUserBalance: schema.UserBalance, authId: string, operator: schema.Operator, currentTime: Date): Promise<{ balance: schema.UserBalance; time: Date}> {
    const newTime = new Date(currentTime.getTime() + faker.number.int({ min: 1, max: 5 }) * 60 * 60 * 1000);
    const depositAmount = faker.number.int({ min: 2000, max: 10000 });
    const bonusAmount = faker.datatype.boolean(0.5) ? Math.floor(depositAmount * faker.number.float({ min: 0.5, max: 1.5 })) : 0;

    if (bonusAmount > 0) {
        userState.wageringRequirementRemaining += bonusAmount * WAGERING_REQUIREMENT_MULTIPLIER;
    }
    userState.depositCount++;

    await db.insert(schema.depositAndBonusLogTable).values({
        userId: authId, operatorId: operator.id, userBalanceTable: currentUserBalance.id,
        depositAmount, realAmountBefore: currentUserBalance.realBalance, realAmountAfter: currentUserBalance.realBalance + depositAmount,
        bonusAwardedAmount: bonusAmount, bonusBalanceBefore: currentUserBalance.bonusBalance, bonusBalanceAfter: currentUserBalance.bonusBalance + bonusAmount,
        createdAt: newTime, depositOrBonus: "DEPOSIT_CASHAPP"
    });

    const [updatedBalance] = await db.update(schema.userBalanceTable).set({
        realBalance: currentUserBalance.realBalance + depositAmount,
        bonusBalance: currentUserBalance.bonusBalance + bonusAmount,
        updatedAt: newTime,
        bonusWageringRemaining: userState.wageringRequirementRemaining
    }).where(eq(schema.userBalanceTable.id, currentUserBalance.id)).returning();

    return { balance: updatedBalance, time: newTime };
}

async function triggerWithdrawalIfNeeded(userState: UserState, currentUserBalance: schema.UserBalance, authId: string, operator: schema.Operator, winAmount: number, currentTime: Date): Promise<schema.UserBalance> {
    const largeWinThreshold = 50000;
    if (!userState.hasMadeWithdrawal && winAmount > largeWinThreshold && userState.wageringRequirementRemaining <= 0) {
        const withdrawalAmount = Math.floor(currentUserBalance.realBalance * faker.number.float({ min: 0.5, max: 0.9 }));
        if (withdrawalAmount <= 0) return currentUserBalance;

        userState.hasMadeWithdrawal = true;

        await db.insert(schema.depositAndBonusLogTable).values({
            userId: authId, operatorId: operator.id, userBalanceTable: currentUserBalance.id,
            depositAmount: -withdrawalAmount, realAmountBefore: currentUserBalance.realBalance, realAmountAfter: currentUserBalance.realBalance - withdrawalAmount,
            bonusAwardedAmount: 0, bonusBalanceBefore: currentUserBalance.bonusBalance, bonusBalanceAfter: currentUserBalance.bonusBalance,
            createdAt: new Date(currentTime.getTime() + 1000 * 60 * 15),
            depositOrBonus: "DEPOSIT_CASHAPP" // This should be a 'WITHDRAWAL' type in a real schema
        });

        return (await db.update(schema.userBalanceTable).set({
            realBalance: currentUserBalance.realBalance - withdrawalAmount,
        }).where(eq(schema.userBalanceTable.id, currentUserBalance.id)).returning())[0];
    }
    return currentUserBalance;
}

async function simulateUserLifecycle(operator: schema.Operator, userCreationDate: Date) {
    const authId = faker.string.uuid();
    let currentTime = userCreationDate;
    const userState = new UserState();

    await db.insert(schema.users).values({ authId, email: faker.internet.email(), displayName: faker.person.fullName(), createdAt: userCreationDate });
    let [currentUserBalance] = await db.insert(schema.userBalanceTable).values({
        id: faker.string.uuid(), userId: authId,
        realBalance: 0, bonusBalance: 0,
        createdAt: userCreationDate, updatedAt: userCreationDate,
    }).returning();

    let depositResult = await triggerDeposit(userState, currentUserBalance, authId, operator, currentTime);
    currentUserBalance = depositResult.balance;
    currentTime = depositResult.time;

    for (let j = 0; j < TOTAL_GAMEPLAY_SESSIONS; j++) {
        const [gameSession] = await db.insert(schema.gameSessionTable).values({
            userId: authId, gameId: faker.string.uuid(), gameName: faker.commerce.productName(),
            createdAt: currentTime, updatedAt: currentTime,
        }).returning();

        for (let k = 0; k < faker.number.int({min: 20, max: 150}); k++) {
            if (currentUserBalance.realBalance < 500 && userState.depositCount < MAX_DEPOSITS_PER_USER) {
                 depositResult = await triggerDeposit(userState, currentUserBalance, authId, operator, currentTime);
                 currentUserBalance = depositResult.balance;
                 currentTime = depositResult.time;
            }

            const wagerAmount = faker.number.int({ min: 25, max: 500 });
            if (currentUserBalance.realBalance + currentUserBalance.bonusBalance < wagerAmount) continue;

            const bonusWager = Math.min(wagerAmount, currentUserBalance.bonusBalance);
            const realWager = wagerAmount - bonusWager;
            userState.wageringRequirementRemaining = Math.max(0, userState.wageringRequirementRemaining - wagerAmount);

            const winAmount = calculateWinAmount(wagerAmount);

            await db.insert(schema.betLogTable).values({
                userId: authId, gameSessionId: gameSession.id, operatorId: operator.id,
                wagerAmount, winAmount,
                realAmountBefore: currentUserBalance.realBalance, realAmountAfter: currentUserBalance.realBalance - realWager + winAmount,
                bonusBalanceBefore: currentUserBalance.bonusBalance, bonusBalanceAfter: currentUserBalance.bonusBalance - bonusWager,
                createdAt: currentTime, gameId: gameSession.gameId, gameName: gameSession.gameName
            });

            [currentUserBalance] = await db.update(schema.userBalanceTable).set({
                realBalance: currentUserBalance.realBalance - realWager + winAmount,
                bonusBalance: currentUserBalance.bonusBalance - bonusWager,
                updatedAt: currentTime,
                bonusWageringRemaining: userState.wageringRequirementRemaining
            }).where(eq(schema.userBalanceTable.id, currentUserBalance.id)).returning();

            currentUserBalance = await triggerWithdrawalIfNeeded(userState, currentUserBalance, authId, operator, winAmount, currentTime);
        }
    }
}

// --- MAIN EXECUTION ---
async function main() {
    console.log('🚀 Starting database seeding process...');
    await cleanDatabase();
    const operators = await createOperators(OPERATOR_COUNT);
    const now = new Date();

    for (const operator of operators) {
        console.log(`--- Simulating users for operator: ${operator.name} ---`);
        for (let i = 0; i < USERS_PER_OPERATOR; i++) {
            const userCreationDate = faker.date.between({ from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to: now });
            await simulateUserLifecycle(operator, userCreationDate);
            process.stdout.write(`\r👤 User ${i + 1}/${USERS_PER_OPERATOR} simulated.`);
        }
        console.log(`\n--- Operator ${operator.name} complete ---`);
    }

    console.log('\n✅ Database seeded successfully!');
    await pool.end();
    process.exit(0);
}

main().catch((err) => {
  console.error('🔴 Seeding failed:', err);
  pool.end();
  process.exit(1);
});
