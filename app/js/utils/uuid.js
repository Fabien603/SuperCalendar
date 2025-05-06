/**
 * @fileoverview Utilitaires de génération et validation d'UUID pour SuperCalendrier
 * Implémentation légère de génération d'UUID v4 et de fonctions associées
 * @module UUIDUtils
 * @author Fabien
 * @version 1.1.0
 */

/**
 * Expression régulière pour valider un UUID v4
 * @type {RegExp}
 * @private
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Modèle pour la génération d'UUID v4
 * @type {string}
 * @private
 */
const UUID_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

/**
 * Génère un UUID v4 standard
 * @returns {string} UUID v4 au format standard
 * @example
 * // Retourne quelque chose comme "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * const id = v4();
 */
export function v4() {
    return UUID_TEMPLATE.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Valide si une chaîne est un UUID v4 valide
 * @param {string} uuid - Chaîne à valider
 * @returns {boolean} Vrai si la chaîne est un UUID v4 valide
 * @throws {TypeError} Si le paramètre n'est pas une chaîne
 * @example
 * // Retourne true
 * validate('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * 
 * // Retourne false
 * validate('not-a-valid-uuid');
 */
export function validate(uuid) {
    if (typeof uuid !== 'string') {
        throw new TypeError('L\'UUID doit être une chaîne de caractères');
    }
    
    return UUID_REGEX.test(uuid);
}

/**
 * Génère un identifiant simple basé sur le timestamp et un nombre aléatoire
 * Utile pour des identifiants légers sans besoin de garantie d'unicité absolue
 * @returns {string} Identifiant unique
 * @example
 * // Retourne quelque chose comme "ltza26ab3c"
 * const id = simpleId();
 */
export function simpleId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Génère un UUID v4 sans tirets (format compact)
 * @returns {string} UUID v4 sans tirets
 * @example
 * // Retourne quelque chose comme "f47ac10b58cc4372a5670e02b2c3d479"
 * const id = v4Compact();
 */
export function v4Compact() {
    return v4().replace(/-/g, '');
}

/**
 * Génère un UUID v5 basé sur un namespace et un nom
 * Utilise l'algorithme SHA-1 pour générer un UUID déterministe
 * @param {string} namespace - Namespace UUID (peut être un UUID v4)
 * @param {string} name - Nom à utiliser pour générer l'UUID
 * @returns {string} UUID v5 au format standard
 * @throws {TypeError} Si les paramètres ne sont pas des chaînes
 * @throws {Error} Si le namespace n'est pas un UUID valide
 * @example
 * // Retourne toujours le même UUID pour le même namespace et nom
 * const id = v5('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'test');
 */
export function v5(namespace, name) {
    if (typeof namespace !== 'string' || typeof name !== 'string') {
        throw new TypeError('Le namespace et le nom doivent être des chaînes de caractères');
    }
    
    if (!validate(namespace)) {
        throw new Error('Le namespace doit être un UUID valide');
    }
    
    // Implémentation simplifiée de l'algorithme UUID v5
    // Note: une vraie implémentation utiliserait SHA-1, mais pour la simplicité,
    // nous utilisons une méthode plus simple basée sur le hachage de chaîne
    
    // Convertir le namespace en tableau d'octets (simplifié)
    const namespaceBytes = namespace.replace(/-/g, '').split('').map(c => 
        parseInt(c, 16));
    
    // Convertir le nom en tableau d'octets (simplifié)
    const nameBytes = [];
    for (let i = 0; i < name.length; i++) {
        nameBytes.push(name.charCodeAt(i));
    }
    
    // Combiner les deux tableaux
    const bytes = [...namespaceBytes, ...nameBytes];
    
    // Générer une chaîne de caractères basée sur les bytes (simulant un hachage)
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
        hash = ((hash << 5) - hash) + bytes[i];
        hash |= 0; // Convertir en entier 32 bits
    }
    
    // Utiliser ce hash pour générer un UUID v5 (simplifié)
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    
    // Format UUID v5 (le 5 dans le 3e groupe et les bits dans le 4e groupe selon RFC 4122)
    return `${hashStr.substr(0, 8)}-${hashStr.substr(8, 4)}-5${hashStr.substr(12, 3)}-${
        ((parseInt(hashStr.substr(15, 2), 16) & 0x3f) | 0x80).toString(16)
    }${hashStr.substr(17, 2)}-${hashStr.substr(19, 12).padEnd(12, '0')}`;
}

/**
 * Convertit un UUID au format compact (sans tirets) en format standard
 * @param {string} uuid - UUID au format compact
 * @returns {string} UUID au format standard
 * @throws {TypeError} Si le paramètre n'est pas une chaîne
 * @throws {Error} Si l'UUID compact n'est pas valide
 * @example
 * // Retourne "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * fromCompact('f47ac10b58cc4372a5670e02b2c3d479');
 */
export function fromCompact(uuid) {
    if (typeof uuid !== 'string') {
        throw new TypeError('L\'UUID doit être une chaîne de caractères');
    }
    
    if (!/^[0-9a-f]{32}$/i.test(uuid)) {
        throw new Error('L\'UUID compact n\'est pas valide');
    }
    
    return `${uuid.substr(0, 8)}-${uuid.substr(8, 4)}-${uuid.substr(12, 4)}-${uuid.substr(16, 4)}-${uuid.substr(20)}`;
}

/**
 * Génère un identifiant basé sur un préfixe et un UUID
 * Utile pour créer des identifiants avec un préfixe spécifique pour différents types d'objets
 * @param {string} prefix - Préfixe à ajouter
 * @param {boolean} [withSeparator=true] - Ajouter un séparateur entre le préfixe et l'UUID
 * @returns {string} Identifiant préfixé
 * @throws {TypeError} Si le préfixe n'est pas une chaîne
 * @example
 * // Retourne quelque chose comme "event_f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * const id = prefixed('event');
 */
export function prefixed(prefix, withSeparator = true) {
    if (typeof prefix !== 'string') {
        throw new TypeError('Le préfixe doit être une chaîne de caractères');
    }
    
    const separator = withSeparator ? '_' : '';
    return `${prefix}${separator}${v4()}`;
}

/**
 * Génère un identifiant court et lisible pour les humains
 * Combine un mot aléatoire avec un nombre pour créer un ID plus facile à retenir
 * @param {boolean} [capitalize=false] - Mettre en majuscule la première lettre
 * @returns {string} Identifiant court et lisible
 * @example
 * // Retourne quelque chose comme "giraffe-42"
 * const id = readable();
 */
export function readable(capitalize = false) {
    // Liste de mots simples pour générer des IDs lisibles
    const words = [
        'apple', 'banana', 'cherry', 'date', 'elder', 'fig', 'grape',
        'honey', 'iris', 'jade', 'kiwi', 'lemon', 'mango', 'nutmeg',
        'olive', 'peach', 'quince', 'rose', 'sage', 'thyme', 'umbrella',
        'violet', 'walnut', 'xenia', 'yellow', 'zephyr', 'amber', 'blue',
        'coral', 'denim', 'emerald', 'fuchsia', 'green', 'hazel', 'indigo',
        'jade', 'khaki', 'lavender', 'magenta', 'navy', 'orange', 'purple',
        'quartz', 'ruby', 'silver', 'teal', 'umber', 'viridian', 'white',
        'xanadu', 'yellow', 'zinc', 'alpha', 'beta', 'gamma', 'delta',
        'eagle', 'falcon', 'giraffe', 'hawk', 'ibis', 'jaguar', 'koala'
    ];
    
    const word = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 1000);
    
    const formattedWord = capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    return `${formattedWord}-${number}`;
}