// Simple implementation of UUID v4 generation
// This is a lightweight alternative to importing the full uuid package

/**
 * Generates a UUID v4 string
 * @returns {string} A UUID v4 string
 */
export function v4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Validates if a string is a valid UUID
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if the string is a valid UUID
 */
export function validate(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

/**
 * Generates a simple ID based on timestamp and random number
 * @returns {string} A unique ID
 */
export function simpleId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}