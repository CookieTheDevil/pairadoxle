const STORAGE_KEY = "pairadoxle-progress"; 

const DEVICE_ID_KEY = "pairadoxle-device-id";

export function saveProgress(progress) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(progress)
        );

        return true; 
    } catch (error) {
        console.error("Could not save progress: ", error); 
        return false; 
    }
}

export function loadProgress() {
    try {
        const storedValue = localStorage.getItem(STORAGE_KEY); 

        if (!storedValue) {
            return null; 
        }

        return JSON.parse(storedValue); 
    } catch (error) {
        console.error("Could not load progress: ", error); 
        clearProgress(); 
        return null; 
    }
}

export function clearProgress() {
    localStorage.removeItem(STORAGE_KEY); 
}

export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
}