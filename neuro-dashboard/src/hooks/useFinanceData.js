import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';

export function useFinanceData() {
  const data = useLiveQuery(async () => {
    const [
      monthlySalaries,
      onCallEntries,
      medicationEntries,
      fixedPercentages,
      operations,
      operationTypes,
      leavePeriods,
      monthlyPhotos
    ] = await Promise.all([
      db.monthlySalaries.toArray(),
      db.onCallEntries.toArray(),
      db.medicationEntries.toArray(),
      db.fixedPercentages.toArray(),
      db.operations.orderBy('date').reverse().toArray(),
      db.operationTypes.toArray(),
      db.leavePeriods.toArray(),
      db.monthlyPhotos.toArray()
    ]);
    return {
      monthlySalaries,
      onCallEntries,
      medicationEntries,
      fixedPercentages,
      operations,
      operationTypes,
      leavePeriods,
      monthlyPhotos
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
      leavePeriods: [],
      monthlyPhotos: []
    }
  );
}
