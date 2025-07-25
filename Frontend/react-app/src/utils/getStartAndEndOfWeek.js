// Fonction utilitaire pour obtenir le début et la fin d'une semaine donnée (ISO)
export function getStartAndEndOfWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  let start = simple;
  if (dow <= 4 && dow !== 0) {
    start.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    start.setDate(simple.getDate() - (simple.getDay() === 0 ? 6 : simple.getDay() - 1));
  }
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  return { start, end };
} 