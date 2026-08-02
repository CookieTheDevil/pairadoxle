export class GameTimer {
    constructor(timerElement) {
        if (!(timerElement instanceof HTMLElement)) {
            throw new Error("GameTimer requires a valid HTML element.");
        }

        this.timerElement = timerElement;
        this.intervalId = null;
        this.startAt = null;
        this.elapsedBeforeStart = 0;

        this.render(0); 
    }

    start() {
        if (this.intervalId !== null) {
            return;
        }

        this.startAt = Date.now();

        this.intervalId = window.setInterval(() => {
            this.render(this.getElapsedMilliseconds());
        }, 250); 
    }

    stop() {
        if (this.intervalId === null) {
            return;
        }

        this.elapsedBeforeStart = this.getElapsedMilliseconds();

        window.clearInterval(this.intervalId);
        this.intervalId = null;
        this.startAt = null;

        this.render(this.elapsedBeforeStart);
    }

    reset() {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
        }

        this.intervalId = null;
        this.startAt = null;
        this.elapsedBeforeStart = 0;

        this.render(0);
    }

    getElapsedMilliseconds() {
        if (this.startAt === null) {
            return this.elapsedBeforeStart;
        }

        return this.elapsedBeforeStart + (Date.now() - this.startAt);
    }

    render(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        this.timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;
    }
}