const integerFormatter = new Intl.NumberFormat("fr-CA", {
  maximumFractionDigits: 0,
});

export function formatMoney(
  amountMinor: string,
  minorUnit: number,
  currencyCode: string,
): string {
  const amount = BigInt(amountMinor);
  const absoluteAmount = amount < 0n ? -amount : amount;
  const divisor = 10n ** BigInt(minorUnit);

  const whole = integerFormatter.format(absoluteAmount / divisor);

  const fraction =
    minorUnit > 0
      ? `,${(absoluteAmount % divisor)
          .toString()
          .padStart(minorUnit, "0")}`
      : "";

  const sign = amount < 0n ? "−" : "";

  return `${sign}${whole}${fraction}\u00a0${currencyCode}`;
}