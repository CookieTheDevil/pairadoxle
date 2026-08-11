/** 
 * The function is returned to give a random number on demand,
 * but the number is unique for each date
 */
export function createSeededRandom(seedString) {
    let seed = hashString(seedString);

    return function random() {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;

        let value = Math.imul(
            seed ^ seed >>> 15,
            1 | seed
        );

        value =
            value +
            Math.imul(
                value ^ value >>> 7,
                61 | value
            )
            ^ value;

        return (
            (value ^ value >>> 14) >>> 0
        ) / 4294967296;
    };
}

function hashString(value) {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);

        hash = Math.imul(
            hash,
            16777619
        );
    }

    return hash >>> 0;
}