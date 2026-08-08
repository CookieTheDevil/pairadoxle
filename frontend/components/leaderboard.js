import {
    fetchLeaderboard
} from "../leaderboard-api.js";

export class Leaderboard {
    constructor({tableBody, statusElement, puzzleId}) {
        this.tableBody = tableBody;
        this.statusElement = statusElement;
        this.puzzleId = puzzleId;
    }

    async load() {
        this.showStatus("Loading...");

        this.tableBody.innerHTML = "";

        try {
            const data = await fetchLeaderboard(this.puzzleId);

            this.render(data.entries);
        } catch (error) {
            console.error(
                "Could not load leaderboard:",
                error
            );

            this.showStatus(
                "Could not load leaderboard."
            );
        }
    }

    render(entries) {
        this.tableBody.innerHTML = "";

        if (entries.length === 0) {
            this.showStatus(
                "No scores yet. Be the first!"
            );

            return;
        }

        this.hideStatus();

        entries.forEach((entry) => {
            const row = document.createElement("tr");
            row.append( createCell(entry.rank),
                createCell(entry.player_name),
                createCell(formatTime(entry.time_ms)),
                createCell(entry.hints_used));

            this.tableBody.append(row);
        });
    }

    showStatus(message) {
        this.statusElement.textContent = message;
        this.statusElement.hidden = false;
    }

    hideStatus() {
        this.statusElement.hidden = true;
    }
}


function createCell(value) {
    const cell = document.createElement("td");

    /*
     * textContent is safe for user-created
     * player names.
     */
    cell.textContent = String(value);

    return cell;
}


function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}