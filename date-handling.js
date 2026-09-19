import { getDailyPuzzleId } from "./daily-puzzle.js";

const FIRST_PUZZLE_DATE = "2026-08-08";

/* =========================================================
   PUZZLE DATE HANDLING
   ========================================================= */

function isValidPuzzleDateFormat(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
}

export function isValidArchiveDate(date) {
    if (!isValidPuzzleDateFormat(date)) {
        return false;
    }

    const today = getDailyPuzzleId();

    return (date >= FIRST_PUZZLE_DATE && date < today);
}

export function getRequestedPuzzleId() {
    const params = new URLSearchParams(window.location.search);

    const requestedDate = params.get("date");

    if (!requestedDate) {
        return getDailyPuzzleId();
    }

    if (!isValidArchiveDate(requestedDate)) {
        return getDailyPuzzleId();
    }

    return requestedDate;
}


/* =========================================================
   ARCHIVE CALENDAR
   ========================================================= */

function formatArchivePuzzleId(year, month, day) {
    return [
        String(year).padStart(4, "0"),
        String(month + 1).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}

function getMonthKey(year, month) {
    return year * 12 + month;
}

function getFirstArchiveMonth() {
    const [year, month] =
        FIRST_PUZZLE_DATE
            .split("-")
            .map(Number);

    return {
        year,
        month: month - 1
    };
}

function openArchivedPuzzle(puzzleId) {
    const url =
        new URL(window.location.href);

    /*
     * Remove any previous query parameters.
     */
    url.search = "";

    url.searchParams.set(
        "date",
        puzzleId
    );

    window.location.href =
        url.toString();
}


/* =========================================================
   ARCHIVE UI
   ========================================================= */

export function initialiseArchive({
    onOpen = () => {},
    onClose = () => {}
} = {}) {
    const archiveModal = document.querySelector("#archive-modal");
    const openArchiveButton = document.querySelector("#open-archive-button");
    const closeArchiveButton = document.querySelector("#close-archive-button");
    const archiveCalendar = document.querySelector("#archive-calendar");
    const archiveMonthTitle = document.querySelector("#archive-month-title");
    const archivePreviousMonth = document.querySelector("#archive-previous-month");
    const archiveNextMonth = document.querySelector("#archive-next-month");

    if (
        !archiveModal ||
        !openArchiveButton ||
        !closeArchiveButton ||
        !archiveCalendar ||
        !archiveMonthTitle ||
        !archivePreviousMonth ||
        !archiveNextMonth
    ) {
        throw new Error(
            "One or more archive elements are missing."
        );
    }

    /* -----------------------------------------------------
       Initial displayed month
       ----------------------------------------------------- */

    const requestedPuzzleId = getRequestedPuzzleId();
    const [requestedYear, requestedMonth] = requestedPuzzleId.split("-").map(Number);

    let displayedArchiveYear = requestedYear;
    let displayedArchiveMonth = requestedMonth - 1;

    const todayPuzzleId = getDailyPuzzleId();
    const [currentYear, currentMonth] = todayPuzzleId.split("-").map(Number);

    /* -----------------------------------------------------
       Navigation state
       ----------------------------------------------------- */

    function updateArchiveNavigation() {
        const first = getFirstArchiveMonth();

        const currentKey = getMonthKey(displayedArchiveYear, displayedArchiveMonth);
        const firstKey = getMonthKey(first.year, first.month);
        const latestKey = getMonthKey(currentYear, currentMonth - 1);

        archivePreviousMonth.disabled = currentKey <= firstKey;
        archiveNextMonth.disabled = currentKey >= latestKey;
    }


    /* -----------------------------------------------------
       Calendar rendering
       ----------------------------------------------------- */

    function renderArchiveCalendar() {
        archiveCalendar.replaceChildren();

        const monthDate = new Date(displayedArchiveYear, displayedArchiveMonth, 1);

        archiveMonthTitle.textContent =
            monthDate.toLocaleDateString(
                "en-GB",
                {
                    month: "long",
                    year: "numeric"
                }
            );

        const firstDayOfMonth =
            new Date(
                displayedArchiveYear,
                displayedArchiveMonth,
                1
            );

        const daysInMonth =
            new Date(
                displayedArchiveYear,
                displayedArchiveMonth + 1,
                0
            ).getDate();


        /*
         * JS:
         * Sunday = 0
         *
         * Calendar:
         * Monday = 0
         */
        const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

        /*
         * Empty cells before the first day.
         */
        for (let index = 0; index < startOffset; index += 1) {
            const spacer = document.createElement("span");
            spacer.className = "archive-day-spacer";
            archiveCalendar.append(spacer);
        }


        /*
         * Actual dates.
         */
        for (let day = 1; day <= daysInMonth; day += 1) {
            const puzzleId = formatArchivePuzzleId(displayedArchiveYear, displayedArchiveMonth, day);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "archive-day";
            button.textContent = String(day);

            /*
             * This only checks whether the date
             * belongs to the archive.
             *
             * It deliberately does NOT check
             * whether the player has played it.
             */
            button.disabled = !isValidArchiveDate(puzzleId);

            if (!button.disabled) {
                button.addEventListener(
                    "click",
                    () => {
                        openArchivedPuzzle(
                            puzzleId
                        );
                    }
                );
            }


            archiveCalendar.append(button);
        }

        updateArchiveNavigation();
    }

    /* -----------------------------------------------------
       Month arrows
       ----------------------------------------------------- */

    archivePreviousMonth.addEventListener(
        "click",
        () => {
            displayedArchiveMonth -= 1;

            if (displayedArchiveMonth < 0) {
                displayedArchiveMonth = 11;
                displayedArchiveYear -= 1;
            }

            renderArchiveCalendar();
        }
    );


    archiveNextMonth.addEventListener(
        "click",
        () => {
            displayedArchiveMonth += 1;

            if (displayedArchiveMonth > 11) {
                displayedArchiveMonth = 0;
                displayedArchiveYear += 1;
            }

            renderArchiveCalendar();
        }
    );

    /* -----------------------------------------------------
       Open / close modal
       ----------------------------------------------------- */

    openArchiveButton.addEventListener(
        "click",
        () => {
            if (archiveModal.open) {
                return;
            }

            onOpen();

            renderArchiveCalendar();

            archiveModal.showModal();
        }
    );


    closeArchiveButton.addEventListener(
        "click",
        () => {
            archiveModal.close();
        }
    );


    archiveModal.addEventListener(
        "click",
        (event) => {
            if (event.target === archiveModal) {
                archiveModal.close();
            }
        }
    );


    archiveModal.addEventListener(
        "close",
        () => {
            onClose();
        }
    );
}