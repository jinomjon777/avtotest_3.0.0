// questionKey.js uchun turlar (modul brauzerda ham, Node skriptida ham ishlatiladi — shuning uchun JS).
export function normalizeQuestionText(text: unknown): string;
export function canonicalQuestionString(uzLatText: string, optionTexts?: string[]): string;
export function sha256Hex(str: string): string;
export function questionKey(uzLatText: string, optionTexts?: string[]): string | null;
export function questionKeyFromTask(task: unknown): string | null;
