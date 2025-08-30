
import { GovernanceRule } from '../types';
import { getDb, saveDatabase } from './sqliteService';
import { getCurrentUser } from './authService';

const fromDbToRule = (dbObj: any): GovernanceRule => ({
    ...dbObj,
    isActive: !!dbObj.isActive,
});

export const getRules = async (): Promise<GovernanceRule[]> => {
    const user = await getCurrentUser();
    if (!user) return [];
    const db = await getDb();
    const res = db.exec("SELECT * FROM governance_rules WHERE user_id = ?", [user.id]);
    if (res.length === 0) return [];

    const columns = res[0].columns;
    const values = res[0].values;

    return values.map(row => {
        const dbObj = Object.fromEntries(columns.map((col, i) => [col, row[i]]));
        return fromDbToRule(dbObj);
    });
};

export const addRule = async (ruleText: string): Promise<GovernanceRule[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();

    db.run(
        "INSERT INTO governance_rules (id, user_id, rule, isActive) VALUES (?, ?, ?, ?)",
        [`rule_${Date.now()}`, user.id, ruleText, 1] // Active by default
    );

    await saveDatabase();
    return getRules();
};

export const updateRuleStatus = async (ruleId: string, isActive: boolean): Promise<GovernanceRule[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();

    db.run(
        "UPDATE governance_rules SET isActive = ? WHERE id = ? AND user_id = ?",
        [isActive ? 1 : 0, ruleId, user.id]
    );
    
    await saveDatabase();
    return getRules();
};

export const deleteRule = async (ruleId: string): Promise<GovernanceRule[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not logged in");
    const db = await getDb();
    db.run("DELETE FROM governance_rules WHERE id = ? AND user_id = ?", [ruleId, user.id]);
    await saveDatabase();
    return getRules();
};