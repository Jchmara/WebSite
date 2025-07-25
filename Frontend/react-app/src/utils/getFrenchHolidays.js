// Fonction utilitaire pour obtenir les jours fériés français d'une année
export function getFrenchHolidays(year) {
  // Jours fixes
  const holidays = [
    `${year}-01-01`, // Jour de l'an
    `${year}-05-01`, // Fête du Travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
  ];
  // Jours mobiles (calculés à partir de Pâques)
  function easterDate(y) {
    const f = Math.floor,
      G = y % 19,
      C = f(y / 100),
      H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
      I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
      J = (y + f(y / 4) + I + 2 - C + f(C / 4)) % 7,
      L = I - J,
      month = 3 + f((L + 40) / 44),
      day = L + 28 - 31 * f(month / 4);
    return new Date(y, month - 1, day);
  }
  const easter = easterDate(year);
  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }
  function fmt(d) {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }
  holidays.push(fmt(addDays(easter, 1)));   // Lundi de Pâques
  holidays.push(fmt(addDays(easter, 39)));  // Ascension
  holidays.push(fmt(addDays(easter, 50)));  // Lundi de Pentecôte
  holidays.push(fmt(addDays(easter, 60)));  // Fête-Dieu
  return holidays;
} 