import type { Transaction } from '../db/db';

/**
 * Generate recurring transaction instances for a date range
 * @param transaction The recurring transaction template
 * @param startDate Start of date range to generate instances
 * @param endDate End of date range to generate instances
 * @returns Array of virtual transaction instances
 */
export function generateRecurringInstances(
    transaction: Transaction,
    startDate: Date,
    endDate: Date
): Transaction[] {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return [];
    }

    const instances: Transaction[] = [];
    const recurrenceStart = new Date(transaction.date);
    recurrenceStart.setHours(0, 0, 0, 0);

    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(0, 0, 0, 0);

    // Determine the effective end date for the recurrence
    let recurrenceEnd: Date;
    if (transaction.recurrenceEndDate) {
        recurrenceEnd = new Date(transaction.recurrenceEndDate);
        recurrenceEnd.setHours(0, 0, 0, 0);
    } else {
        // If "until canceled", use the range end date
        recurrenceEnd = new Date(rangeEnd);
    }

    // Start from the first occurrence within or after the range start
    let currentDate = new Date(recurrenceStart);

    // Fast-forward to range start if recurrence started before it
    while (currentDate < rangeStart) {
        currentDate = getNextOccurrence(transaction, currentDate);
        if (currentDate > recurrenceEnd) {
            return instances; // No instances in this range
        }
    }

    // Generate instances within the range
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
        // Create a virtual instance
        instances.push({
            ...transaction,
            date: new Date(currentDate),
            // Mark it as a generated instance (you can add a flag if needed)
        });

        currentDate = getNextOccurrence(transaction, currentDate);
    }

    return instances;
}

/**
 * Calculate the next occurrence date for a recurring transaction
 * @param transaction The recurring transaction
 * @param fromDate Calculate next occurrence after this date
 * @returns Next occurrence date
 */
export function getNextOccurrence(transaction: Transaction, fromDate: Date): Date {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return new Date(fromDate);
    }

    const nextDate = new Date(fromDate);

    switch (transaction.recurrenceFrequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return nextDate;
}

/**
 * Format a human-readable summary of the recurrence
 * @param transaction The recurring transaction
 * @returns Formatted string like "monthly · until Mar 2026" or "weekly · until canceled"
 */
export function formatRecurrenceSummary(transaction: Transaction): string {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return '';
    }

    const frequency = transaction.recurrenceFrequency;
    let endText: string;

    if (transaction.recurrenceEndDate) {
        const endDate = new Date(transaction.recurrenceEndDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        endText = `until ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    } else {
        endText = 'until canceled';
    }

    return `${frequency} · ${endText}`;
}

/**
 * Check if a recurring transaction is active on a specific date
 * @param transaction The recurring transaction
 * @param date The date to check
 * @returns True if the transaction occurs on this date
 */
export function isRecurringActiveOnDate(transaction: Transaction, date: Date): boolean {
    if (!transaction.isRecurring || !transaction.recurrenceFrequency) {
        return false;
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const startDate = new Date(transaction.date);
    startDate.setHours(0, 0, 0, 0);

    // Check if date is before start
    if (checkDate < startDate) {
        return false;
    }

    // Check if date is after end (if end date exists)
    if (transaction.recurrenceEndDate) {
        const endDate = new Date(transaction.recurrenceEndDate);
        endDate.setHours(0, 0, 0, 0);
        if (checkDate > endDate) {
            return false;
        }
    }

    // Check if date matches the recurrence pattern
    const daysDiff = Math.floor((checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (transaction.recurrenceFrequency) {
        case 'daily':
            return true; // Every day is valid
        case 'weekly':
            return daysDiff % 7 === 0;
        case 'monthly':
            return checkDate.getDate() === startDate.getDate();
        case 'yearly':
            return checkDate.getDate() === startDate.getDate() &&
                checkDate.getMonth() === startDate.getMonth();
        default:
            return false;
    }
}
