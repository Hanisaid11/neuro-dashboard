import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';

// Single source of truth for every page: re-renders automatically whenever
// any underlying Dexie table changes, no manual refetching required.
export function useFinanceData() {
  const data = useLiveQuery(async () => {
    const [
      monthlySalaries,
      onCallEntries,
      medicationEntries,
      fixedPercentages,
      operations,
      operationTypes,
      leavePeriods
    ] = await Promise.all([
      db.monthlySalaries.toArray(),
      db.onCallEntries.toArray(),
      db.medicationEntries.toArray(),
      db.fixedPercentages.toArray(),
      db.operations.orderBy('date').reverse().toArray(),
      db.operationTypes.toArray(),
      db.leavePeriods.toArray()
    ]);
    return {
      monthlySalaries,
      onCallEntries,
      medicationEntries,
      fixedPercentages,
      operations,
      operationTypes,
      leavePeriods
    };
  }, []);

  return (
    data || {
      monthlySalaries: [],
      onCallEntries: [],
      medicationEntries: [],
      fixedPercentages: [],
      operations: [],
      operationTypes: [],
      leavePeriods: []
    }
  );
}
