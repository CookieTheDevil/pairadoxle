const DAILY_TIME_ZONE = "Europe/Oslo";

export function getDailyPuzzleId(date = new Date()) {
    const formatter = new Intl.DateTimeFormat(
        "en-CA", {
            timeZone: DAILY_TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );

    const parts = formatter.formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
        throw new Error(
            "Could not determine daily puzzle date."
        );
    }

    return `${year}-${month}-${day}`;
}

export function formatPuzzleDate(puzzleId, locale = "nb-NO") {
    const [year, month, day] = puzzleId.split("-").map(Number);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        throw new Error(
            `Invalid puzzle id: ${puzzleId}`
        );
    }

    /*
     * Use UTC noon so formatting can never
     * accidentally shift this calendar date.
     */
    const date = new Date(Date.UTC(year, month - 1, day, 12 ));

    return new Intl.DateTimeFormat(
        locale,
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "UTC"
        }
    ).format(date);
}