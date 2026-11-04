export function parseMoney(
  value: string,
  minorUnit: number,
): string {
  if (
    !Number.isInteger(minorUnit) ||
    minorUnit < 0 ||
    minorUnit > 6
  ) {
    throw new Error("La précision de cette devise n’est pas prise en charge.");
  }

  const normalized = value.trim().replace(",", ".");

  if (
    normalized.length > 30 ||
    !/^-?\d+(?:\.\d+)?$/.test(normalized)
  ) {
    throw new Error(
      "Saisissez un montant comme 250,00, sans espaces ni symbole monétaire.",
    );
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = "0", fraction = ""] = unsigned.split(".");

  if (fraction.length > minorUnit) {
    throw new Error(
      `Cette devise accepte au maximum ${minorUnit} décimale(s).`,
    );
  }

  const scale = 10n ** BigInt(minorUnit);
  const amount =
    BigInt(whole) * scale +
    BigInt(fraction.padEnd(minorUnit, "0") || "0");

  if (amount > 999_999_999_999n) {
    throw new Error("Ce montant dépasse la limite autorisée.");
  }

  return (negative ? -amount : amount).toString();
}