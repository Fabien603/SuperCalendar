/**
 * @fileoverview Utilitaires avancés pour manipuler les dates dans SuperCalendrier
 * Ce module fournit des fonctions pour formater, comparer, manipuler et analyser des dates
 * @module DateUtils
 * @author Fabien
 * @version 1.1.0
 */

/**
 * Classe utilitaire pour les opérations sur les dates
 * @class DateUtils
 */
export class DateUtils {
    /**
     * Liste des noms des mois en français
     * @type {Array<string>}
     * @static
     * @readonly
     */
    static MONTHS_FR = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    /**
     * Liste des noms courts des mois en français
     * @type {Array<string>}
     * @static
     * @readonly
     */
    static MONTHS_SHORT_FR = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    
    /**
     * Liste des noms des jours de la semaine en français
     * @type {Array<string>}
     * @static
     * @readonly
     */
    static DAYS_FR = [
        'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
    ];
    
    /**
     * Liste des noms courts des jours de la semaine en français
     * @type {Array<string>}
     * @static
     * @readonly
     */
    static DAYS_SHORT_FR = [
        'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'
    ];

    /**
     * Formate une date au format ISO (YYYY-MM-DD)
     * @param {Date} date - Date à formater
     * @returns {string} - Date formatée
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static formatDate(date) {
        this._validateDate(date);
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Formate une date au format local (JJ/MM/YYYY)
     * @param {Date} date - Date à formater
     * @param {string} [separator='/'] - Séparateur à utiliser
     * @returns {string} - Date formatée
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static formatLocalDate(date, separator = '/') {
        this._validateDate(date);
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${day}${separator}${month}${separator}${year}`;
    }
    
    /**
     * Formate une heure au format 24h (HH:MM)
     * @param {Date} date - Date à formater
     * @param {boolean} [withSeconds=false] - Inclure les secondes
     * @returns {string} - Heure formatée
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static formatTime24h(date, withSeconds = false) {
        this._validateDate(date);
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        if (withSeconds) {
            const seconds = date.getSeconds().toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
        
        return `${hours}:${minutes}`;
    }
    
    /**
     * Formate une heure au format 12h (HH:MM AM/PM)
     * @param {Date} date - Date à formater
     * @param {boolean} [withSeconds=false] - Inclure les secondes
     * @returns {string} - Heure formatée
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static formatTime12h(date, withSeconds = false) {
        this._validateDate(date);
        
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // L'heure '0' doit être '12'
        const hoursStr = hours.toString().padStart(2, '0');
        
        if (withSeconds) {
            const seconds = date.getSeconds().toString().padStart(2, '0');
            return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
        }
        
        return `${hoursStr}:${minutes} ${ampm}`;
    }
    
    /**
     * Formate une date et heure complète
     * @param {Date} date - Date à formater
     * @param {string} [timeFormat='24h'] - Format d'heure ('24h' ou '12h')
     * @param {boolean} [withSeconds=false] - Inclure les secondes
     * @param {string} [separator=' '] - Séparateur entre la date et l'heure
     * @returns {string} - Date et heure formatées
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     * @throws {Error} Si le format d'heure n'est pas valide
     */
    static formatDateTime(date, timeFormat = '24h', withSeconds = false, separator = ' ') {
        this._validateDate(date);
        
        if (timeFormat !== '24h' && timeFormat !== '12h') {
            throw new Error("Format d'heure invalide. Utilisez '24h' ou '12h'.");
        }
        
        const localDate = this.formatLocalDate(date);
        const time = timeFormat === '24h' 
            ? this.formatTime24h(date, withSeconds) 
            : this.formatTime12h(date, withSeconds);
        
        return `${localDate}${separator}${time}`;
    }
    
    /**
     * Vérifier si deux dates représentent le même jour
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {boolean} - Vrai si c'est le même jour
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static isSameDay(date1, date2) {
        this._validateDate(date1);
        this._validateDate(date2);
        
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }
    
    /**
     * Vérifier si deux dates représentent le même mois
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {boolean} - Vrai si c'est le même mois
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static isSameMonth(date1, date2) {
        this._validateDate(date1);
        this._validateDate(date2);
        
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth()
        );
    }
    
    /**
     * Vérifier si deux dates représentent la même année
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {boolean} - Vrai si c'est la même année
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static isSameYear(date1, date2) {
        this._validateDate(date1);
        this._validateDate(date2);
        
        return date1.getFullYear() === date2.getFullYear();
    }
    
    /**
     * Récupérer le nombre de jours dans un mois
     * @param {number} year - Année
     * @param {number} month - Mois (0-11)
     * @returns {number} - Nombre de jours
     * @throws {RangeError} Si le mois n'est pas valide
     */
    static getDaysInMonth(year, month) {
        if (month < 0 || month > 11) {
            throw new RangeError('Le mois doit être compris entre 0 et 11');
        }
        
        return new Date(year, month + 1, 0).getDate();
    }
    
    /**
     * Récupérer le premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
     * @param {number} year - Année
     * @param {number} month - Mois (0-11)
     * @returns {number} - Jour de la semaine (0-6)
     * @throws {RangeError} Si le mois n'est pas valide
     */
    static getFirstDayOfMonth(year, month) {
        if (month < 0 || month > 11) {
            throw new RangeError('Le mois doit être compris entre 0 et 11');
        }
        
        return new Date(year, month, 1).getDay();
    }
    
    /**
     * Récupérer le dernier jour du mois
     * @param {number} year - Année
     * @param {number} month - Mois (0-11)
     * @returns {number} - Jour de la semaine (0-6)
     * @throws {RangeError} Si le mois n'est pas valide
     */
    static getLastDayOfMonth(year, month) {
        if (month < 0 || month > 11) {
            throw new RangeError('Le mois doit être compris entre 0 et 11');
        }
        
        return new Date(year, month + 1, 0).getDay();
    }
    
    /**
     * Récupérer le début de la semaine pour une date donnée
     * @param {Date} date - Date de référence
     * @param {number} [startDay=1] - Premier jour de la semaine (0-6, 0 = Dimanche)
     * @returns {Date} - Date du début de la semaine
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {RangeError} Si startDay n'est pas valide
     */
    static getStartOfWeek(date, startDay = 1) {
        this._validateDate(date);
        
        if (startDay < 0 || startDay > 6) {
            throw new RangeError('Le jour de début de semaine doit être compris entre 0 et 6');
        }
        
        const day = date.getDay();
        const diff = (day < startDay ? 7 : 0) + day - startDay;
        const startDate = new Date(date);
        startDate.setDate(date.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        return startDate;
    }
    
    /**
     * Récupérer la fin de la semaine pour une date donnée
     * @param {Date} date - Date de référence
     * @param {number} [startDay=1] - Premier jour de la semaine (0-6, 0 = Dimanche)
     * @returns {Date} - Date de fin de la semaine
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {RangeError} Si startDay n'est pas valide
     */
    static getEndOfWeek(date, startDay = 1) {
        this._validateDate(date);
        
        if (startDay < 0 || startDay > 6) {
            throw new RangeError('Le jour de début de semaine doit être compris entre 0 et 6');
        }
        
        const startOfWeek = this.getStartOfWeek(date, startDay);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    }
    
    /**
     * Récupérer le début du mois
     * @param {Date} date - Date de référence
     * @returns {Date} - Date du début du mois
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getStartOfMonth(date) {
        this._validateDate(date);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
    }
    
    /**
     * Récupérer la fin du mois
     * @param {Date} date - Date de référence
     * @returns {Date} - Date de fin du mois
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getEndOfMonth(date) {
        this._validateDate(date);
        
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return endOfMonth;
    }
    
    /**
     * Récupérer le début du trimestre
     * @param {Date} date - Date de référence
     * @returns {Date} - Date du début du trimestre
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getStartOfQuarter(date) {
        this._validateDate(date);
        
        const currentQuarter = Math.floor(date.getMonth() / 3);
        const startOfQuarter = new Date(date.getFullYear(), currentQuarter * 3, 1);
        startOfQuarter.setHours(0, 0, 0, 0);
        return startOfQuarter;
    }
    
    /**
     * Récupérer la fin du trimestre
     * @param {Date} date - Date de référence
     * @returns {Date} - Date de fin du trimestre
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getEndOfQuarter(date) {
        this._validateDate(date);
        
        const currentQuarter = Math.floor(date.getMonth() / 3);
        const endOfQuarter = new Date(date.getFullYear(), currentQuarter * 3 + 3, 0);
        endOfQuarter.setHours(23, 59, 59, 999);
        return endOfQuarter;
    }
    
    /**
     * Récupérer le début de l'année
     * @param {Date} date - Date de référence
     * @returns {Date} - Date du début de l'année
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getStartOfYear(date) {
        this._validateDate(date);
        
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        return startOfYear;
    }
    
    /**
     * Récupérer la fin de l'année
     * @param {Date} date - Date de référence
     * @returns {Date} - Date de fin de l'année
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getEndOfYear(date) {
        this._validateDate(date);
        
        const endOfYear = new Date(date.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return endOfYear;
    }
    
    /**
     * Ajouter des jours à une date
     * @param {Date} date - Date de départ
     * @param {number} days - Nombre de jours à ajouter
     * @returns {Date} - Nouvelle date
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {TypeError} Si days n'est pas un nombre
     */
    static addDays(date, days) {
        this._validateDate(date);
        
        if (typeof days !== 'number') {
            throw new TypeError('Le nombre de jours doit être un nombre');
        }
        
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    /**
     * Ajouter des heures à une date
     * @param {Date} date - Date de départ
     * @param {number} hours - Nombre d'heures à ajouter
     * @returns {Date} - Nouvelle date
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {TypeError} Si hours n'est pas un nombre
     */
    static addHours(date, hours) {
        this._validateDate(date);
        
        if (typeof hours !== 'number') {
            throw new TypeError('Le nombre d\'heures doit être un nombre');
        }
        
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
    
    /**
     * Ajouter des semaines à une date
     * @param {Date} date - Date de départ
     * @param {number} weeks - Nombre de semaines à ajouter
     * @returns {Date} - Nouvelle date
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {TypeError} Si weeks n'est pas un nombre
     */
    static addWeeks(date, weeks) {
        return this.addDays(date, weeks * 7);
    }
    
    /**
     * Ajouter des mois à une date
     * @param {Date} date - Date de départ
     * @param {number} months - Nombre de mois à ajouter
     * @returns {Date} - Nouvelle date
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {TypeError} Si months n'est pas un nombre
     */
    static addMonths(date, months) {
        this._validateDate(date);
        
        if (typeof months !== 'number') {
            throw new TypeError('Le nombre de mois doit être un nombre');
        }
        
        // Conserver le jour du mois
        const dayOfMonth = date.getDate();
        
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        
        // Vérifier si le jour du mois a changé (cas du 31 janvier + 1 mois = 3 mars au lieu de 28/29 février)
        if (result.getDate() !== dayOfMonth) {
            result.setDate(0); // Revenir au dernier jour du mois précédent
        }
        
        return result;
    }
    
    /**
     * Ajouter des années à une date
     * @param {Date} date - Date de départ
     * @param {number} years - Nombre d'années à ajouter
     * @returns {Date} - Nouvelle date
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     * @throws {TypeError} Si years n'est pas un nombre
     */
    static addYears(date, years) {
        this._validateDate(date);
        
        if (typeof years !== 'number') {
            throw new TypeError('Le nombre d\'années doit être un nombre');
        }
        
        // Cas spécial du 29 février dans une année bissextile
        const isLeapDay = date.getMonth() === 1 && date.getDate() === 29;
        
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        
        // Vérifier si on est passé du 29 février à une année non bissextile
        if (isLeapDay && !this.isLeapYear(result.getFullYear())) {
            result.setDate(28); // Ajuster au 28 février
        }
        
        return result;
    }
    
    /**
     * Calculer la différence en jours entre deux dates
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {number} - Différence en jours (toujours positive)
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static diffInDays(date1, date2) {
        this._validateDate(date1);
        this._validateDate(date2);
        
        // Utiliser UTC pour éviter les problèmes de fuseau horaire
        const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
        
        const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
        return Math.floor(Math.abs(utc2 - utc1) / MILLISECONDS_PER_DAY);
    }
    
    /**
     * Calculer la différence en semaines entre deux dates
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {number} - Différence en semaines (toujours positive)
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static diffInWeeks(date1, date2) {
        return Math.floor(this.diffInDays(date1, date2) / 7);
    }
    
    /**
     * Calculer la différence en mois entre deux dates
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {number} - Différence en mois (toujours positive)
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static diffInMonths(date1, date2) {
        this._validateDate(date1);
        this._validateDate(date2);
        
        // Assurer l'ordre chronologique pour le calcul
        const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];
        
        const years = endDate.getFullYear() - startDate.getFullYear();
        const months = endDate.getMonth() - startDate.getMonth();
        const totalMonths = years * 12 + months;
        
        // Ajustement pour les jours du mois
        if (endDate.getDate() < startDate.getDate()) {
            return totalMonths - 1;
        }
        
        return totalMonths;
    }
    
    /**
     * Calculer la différence en années entre deux dates
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {number} - Différence en années (toujours positive)
     * @throws {TypeError} Si l'un des paramètres n'est pas une date valide
     */
    static diffInYears(date1, date2) {
        this._validateDate(date1);
        this._validateDate(date2);
        
        // Assurer l'ordre chronologique pour le calcul
        const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];
        
        let years = endDate.getFullYear() - startDate.getFullYear();
        
        // Ajustement si la date d'anniversaire n'est pas encore passée dans l'année
        if (endDate.getMonth() < startDate.getMonth() || 
            (endDate.getMonth() === startDate.getMonth() && endDate.getDate() < startDate.getDate())) {
            years--;
        }
        
        return years;
    }
    
    /**
     * Calcule l'âge d'une personne à partir de sa date de naissance
     * @param {Date} birthDate - Date de naissance
     * @param {Date} [referenceDate=new Date()] - Date de référence (aujourd'hui par défaut)
     * @returns {number} - Âge en années
     * @throws {TypeError} Si birthDate n'est pas une date valide
     * @throws {RangeError} Si birthDate est dans le futur
     */
    static calculateAge(birthDate, referenceDate = new Date()) {
        this._validateDate(birthDate);
        this._validateDate(referenceDate);
        
        if (birthDate > referenceDate) {
            throw new RangeError('La date de naissance ne peut pas être dans le futur');
        }
        
        return this.diffInYears(birthDate, referenceDate);
    }
    
    /**
     * Vérifier si une date est dans le passé
     * @param {Date} date - Date à vérifier
     * @param {Date} [referenceDate=new Date()] - Date de référence (aujourd'hui par défaut)
     * @returns {boolean} - Vrai si la date est dans le passé
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isPast(date, referenceDate = new Date()) {
        this._validateDate(date);
        this._validateDate(referenceDate);
        
        return date < referenceDate;
    }
    
    /**
     * Vérifier si une date est dans le futur
     * @param {Date} date - Date à vérifier
     * @param {Date} [referenceDate=new Date()] - Date de référence (aujourd'hui par défaut)
     * @returns {boolean} - Vrai si la date est dans le futur
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isFuture(date, referenceDate = new Date()) {
        this._validateDate(date);
        this._validateDate(referenceDate);
        
        return date > referenceDate;
    }
    
    /**
     * Vérifier si une date est aujourd'hui
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est aujourd'hui
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isToday(date) {
        return this.isSameDay(date, new Date());
    }
    
    /**
     * Vérifier si une date est demain
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est demain
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isTomorrow(date) {
        this._validateDate(date);
        
        const tomorrow = this.addDays(new Date(), 1);
        return this.isSameDay(date, tomorrow);
    }
    
    /**
     * Vérifier si une date est hier
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est hier
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isYesterday(date) {
        this._validateDate(date);
        
        const yesterday = this.addDays(new Date(), -1);
        return this.isSameDay(date, yesterday);
    }
    
    /**
     * Vérifier si une date est ce mois-ci
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est ce mois-ci
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isThisMonth(date) {
        return this.isSameMonth(date, new Date());
    }
    
    /**
     * Vérifier si une date est cette année
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est cette année
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isThisYear(date) {
        return this.isSameYear(date, new Date());
    }
    
    /**
     * Vérifier si une date est un jour de la semaine (lundi-vendredi)
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est un jour de la semaine
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isWeekday(date) {
        this._validateDate(date);
        
        const day = date.getDay();
        return day !== 0 && day !== 6; // 0 = dimanche, 6 = samedi
    }
    
    /**
     * Vérifier si une date est un week-end (samedi-dimanche)
     * @param {Date} date - Date à vérifier
     * @returns {boolean} - Vrai si la date est un week-end
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static isWeekend(date) {
        this._validateDate(date);
        
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
    }
    
    /**
     * Vérifier si une année est bissextile
     * @param {number} year - Année à vérifier
     * @returns {boolean} - Vrai si l'année est bissextile
     * @throws {TypeError} Si le paramètre n'est pas un nombre
     */
    static isLeapYear(year) {
        if (typeof year !== 'number') {
            throw new TypeError('L\'année doit être un nombre');
        }
        
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }
    
    /**
     * Récupérer le numéro de la semaine dans l'année (ISO-8601)
     * @param {Date} date - Date à analyser
     * @returns {number} - Numéro de la semaine (1-53)
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getWeekNumber(date) {
        this._validateDate(date);
        
        // Algorithme ISO-8601 pour déterminer la semaine de l'année
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7; // Jour de la semaine avec lundi=0
        target.setDate(target.getDate() - dayNr + 3); // Date du jeudi de la semaine
        const firstThursday = new Date(target.getFullYear(), 0, 4); // Premier jeudi de l'année
        const dayDiff = Math.floor((target - firstThursday) / 86400000); // Diff en jours
        const weekNr = 1 + Math.floor(dayDiff / 7);
        return weekNr;
    }
    
    /**
     * Récupérer le nom du jour de la semaine
     * @param {Date} date - Date à analyser
     * @param {string} [locale='fr-FR'] - Locale à utiliser
     * @param {string} [format='long'] - Format ('long' ou 'short')
     * @returns {string} - Nom du jour
     * @throws {TypeError} Si le paramètre date n'est pas une date valide
     */
    static getDayName(date, locale = 'fr-FR', format = 'long') {
        this._validateDate(date);
        
        // Si le navigateur supporte Intl, utiliser l'API
        if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
            return date.toLocaleDateString(locale, { weekday: format });
        }
        
        // Fallback si l'API n'est pas disponible
        const dayIndex = date.getDay();
        return format === 'long' ? this.DAYS_FR[dayIndex] : this.DAYS_SHORT_FR[dayIndex];
    }
    
    /**
     * Récupérer le nom du mois
     * @param {Date} date - Date à analyser
     * @param {string} [locale='fr-FR'] - Locale à utiliser
     * @param {string} [format='long'] - Format ('long' ou 'short')
     * @returns {string} - Nom du mois
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static getMonthName(date, locale = 'fr-FR', format = 'long') {
        this._validateDate(date);
        
        // Si le navigateur supporte Intl, utiliser l'API
        if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
            return date.toLocaleDateString(locale, { month: format });
        }
        
        // Fallback si l'API n'est pas disponible
        const monthIndex = date.getMonth();
        return format === 'long' ? this.MONTHS_FR[monthIndex] : this.MONTHS_SHORT_FR[monthIndex];
    }
    
    /**
     * Analyser une chaîne de date au format ISO (YYYY-MM-DD)
     * @param {string} dateStr - Chaîne de date
     * @returns {Date} - Objet Date
     * @throws {TypeError} Si le paramètre n'est pas une chaîne
     * @throws {Error} Si le format de la chaîne est invalide
     */
    static parseISODate(dateStr) {
        if (typeof dateStr !== 'string') {
            throw new TypeError('La date doit être une chaîne de caractères');
        }
        
        // Vérifier le format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            throw new Error('Format de date invalide. Utilisez YYYY-MM-DD');
        }
        
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        
        // Vérifier la validité des composants
        if (month < 1 || month > 12) {
            throw new Error('Mois invalide. Doit être entre 1 et 12');
        }
        
        const daysInMonth = this.getDaysInMonth(year, month - 1);
        if (day < 1 || day > daysInMonth) {
            throw new Error(`Jour invalide. Doit être entre 1 et ${daysInMonth} pour le mois spécifié`);
        }
        
        return new Date(year, month - 1, day);
    }
    
    /**
     * Analyser une chaîne de date au format local (JJ/MM/YYYY)
     * @param {string} dateStr - Chaîne de date
     * @param {string} [separator='/'] - Séparateur utilisé
     * @returns {Date} - Objet Date
     * @throws {TypeError} Si le paramètre n'est pas une chaîne
     * @throws {Error} Si le format de la chaîne est invalide
     */
    static parseLocalDate(dateStr, separator = '/') {
        if (typeof dateStr !== 'string') {
            throw new TypeError('La date doit être une chaîne de caractères');
        }
        
        const regex = new RegExp(`^\\d{1,2}\\${separator}\\d{1,2}\\${separator}\\d{4}$`);
        
        // Vérifier le format JJ/MM/YYYY
        if (!regex.test(dateStr)) {
            throw new Error(`Format de date invalide. Utilisez JJ${separator}MM${separator}YYYY`);
        }
        
        const [day, month, year] = dateStr.split(separator).map(num => parseInt(num, 10));
        
        // Vérifier la validité des composants
        if (month < 1 || month > 12) {
            throw new Error('Mois invalide. Doit être entre 1 et 12');
        }
        
        const daysInMonth = this.getDaysInMonth(year, month - 1);
        if (day < 1 || day > daysInMonth) {
            throw new Error(`Jour invalide. Doit être entre 1 et ${daysInMonth} pour le mois spécifié`);
        }
        
        return new Date(year, month - 1, day);
    }
    
    /**
     * Analyser une chaîne d'heure au format HH:MM ou HH:MM:SS
     * @param {string} timeStr - Chaîne d'heure
     * @returns {object} - Objet avec les propriétés hours, minutes et seconds
     * @throws {TypeError} Si le paramètre n'est pas une chaîne
     * @throws {Error} Si le format de la chaîne est invalide
     */
    static parseTime(timeStr) {
        if (typeof timeStr !== 'string') {
            throw new TypeError('L\'heure doit être une chaîne de caractères');
        }
        
        // Vérifier le format HH:MM ou HH:MM:SS
        if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
            throw new Error('Format d\'heure invalide. Utilisez HH:MM ou HH:MM:SS');
        }
        
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
        
        // Vérifier la validité des composants
        if (hours < 0 || hours > 23) {
            throw new Error('Heure invalide. Doit être entre 0 et 23');
        }
        
        if (minutes < 0 || minutes > 59) {
            throw new Error('Minutes invalides. Doit être entre 0 et 59');
        }
        
        if (seconds < 0 || seconds > 59) {
            throw new Error('Secondes invalides. Doit être entre 0 et 59');
        }
        
        return { hours, minutes, seconds };
    }
    
    /**
     * Convertir une chaîne de date et heure en objet Date
     * @param {string} dateStr - Chaîne de date au format YYYY-MM-DD ou JJ/MM/YYYY
     * @param {string} [timeStr='00:00'] - Chaîne d'heure au format HH:MM ou HH:MM:SS
     * @param {boolean} [isISOFormat=true] - Indique si dateStr est au format ISO
     * @returns {Date} - Objet Date
     * @throws {Error} Si les formats sont invalides
     */
    static parseDateTime(dateStr, timeStr = '00:00', isISOFormat = true) {
        // Analyser la date
        const date = isISOFormat 
            ? this.parseISODate(dateStr) 
            : this.parseLocalDate(dateStr);
        
        // Analyser l'heure
        const { hours, minutes, seconds } = this.parseTime(timeStr);
        
        // Définir l'heure
        date.setHours(hours, minutes, seconds, 0);
        
        return date;
    }
    
    /**
     * Obtenir une date avec l'heure à 00:00:00
     * @param {Date} date - Date à modifier
     * @returns {Date} - Date au début de la journée
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static startOfDay(date) {
        this._validateDate(date);
        
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    
    /**
     * Obtenir une date avec l'heure à 23:59:59.999
     * @param {Date} date - Date à modifier
     * @returns {Date} - Date à la fin de la journée
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     */
    static endOfDay(date) {
        this._validateDate(date);
        
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    
    /**
     * Formater une durée en texte
     * @param {number} milliseconds - Durée en millisecondes
     * @param {boolean} [short=false] - Format court ou long
     * @returns {string} - Texte formaté
     * @throws {TypeError} Si le paramètre n'est pas un nombre
     */
    static formatDuration(milliseconds, short = false) {
        if (typeof milliseconds !== 'number') {
            throw new TypeError('La durée doit être un nombre');
        }
        
        // Convertir en secondes, minutes, heures et jours
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        // Format court
        if (short) {
            if (days > 0) return `${days}j`;
            if (hours > 0) return `${hours}h`;
            if (minutes > 0) return `${minutes}m`;
            return `${seconds}s`;
        }
        
        // Format long
        if (days > 0) {
            return `${days} jour${days > 1 ? 's' : ''}`;
        }
        
        if (hours > 0) {
            return `${hours} heure${hours > 1 ? 's' : ''}`;
        }
        
        if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        
        return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }
    
    /**
     * Obtenir une description relative de la date ("il y a 5 min", "dans 2 jours", etc.)
     * @param {Date} date - Date à décrire
     * @param {Date} [referenceDate=new Date()] - Date de référence
     * @param {boolean} [withoutPrefix=false] - Retirer le préfixe "il y a" ou "dans"
     * @returns {string} - Description relative
     * @throws {TypeError} Si les paramètres ne sont pas des dates valides
     */
    static getRelativeTimeDescription(date, referenceDate = new Date(), withoutPrefix = false) {
        this._validateDate(date);
        this._validateDate(referenceDate);
        
        const diffMs = date - referenceDate;
        const isPast = diffMs < 0;
        const absDiffMs = Math.abs(diffMs);
        
        // Définir les seuils pour chaque unité
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        const year = 365 * day;
        
        let description;
        
        // Déterminer la meilleure unité à utiliser
        if (absDiffMs < minute) {
            description = withoutPrefix ? 'quelques secondes' : isPast ? 'il y a quelques secondes' : 'dans quelques secondes';
        } else if (absDiffMs < hour) {
            const minutes = Math.floor(absDiffMs / minute);
            description = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (absDiffMs < day) {
            const hours = Math.floor(absDiffMs / hour);
            description = `${hours} heure${hours > 1 ? 's' : ''}`;
        } else if (absDiffMs < week) {
            const days = Math.floor(absDiffMs / day);
            description = `${days} jour${days > 1 ? 's' : ''}`;
        } else if (absDiffMs < month) {
            const weeks = Math.floor(absDiffMs / week);
            description = `${weeks} semaine${weeks > 1 ? 's' : ''}`;
        } else if (absDiffMs < year) {
            const months = Math.floor(absDiffMs / month);
            description = `${months} mois`;
        } else {
            const years = Math.floor(absDiffMs / year);
            description = `${years} an${years > 1 ? 's' : ''}`;
        }
        
        // Ajouter le préfixe si nécessaire
        if (!withoutPrefix) {
            description = isPast ? `il y a ${description}` : `dans ${description}`;
        }
        
        return description;
    }
    
    /**
     * Obtenir la différence entre deux dates sous forme de durée
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {Object} - Objet avec les propriétés years, months, days, hours, minutes, seconds
     * @throws {TypeError} Si les paramètres ne sont pas des dates valides
     */
    static getDuration(startDate, endDate) {
        this._validateDate(startDate);
        this._validateDate(endDate);
        
        // Assurer l'ordre chronologique
        if (startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
        }
        
        const milliseconds = endDate - startDate;
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        // Calcul des mois et années (plus complexe en raison des mois de longueurs différentes)
        let tempDate = new Date(startDate);
        let months = 0;
        let years = 0;
        
        // Compter les années et les mois
        while (tempDate <= endDate) {
            tempDate.setMonth(tempDate.getMonth() + 1);
            months++;
        }
        
        // Ajuster en soustrayant un mois car nous avons dépassé la date de fin
        months--;
        
        // Calculer les années complètes
        years = Math.floor(months / 12);
        months = months % 12;
        
        // Calculer les jours restants après avoir soustrait les mois complets
        tempDate = new Date(startDate);
        tempDate.setFullYear(startDate.getFullYear() + years);
        tempDate.setMonth(startDate.getMonth() + months);
        
        const remainingDays = Math.floor((endDate - tempDate) / (24 * 60 * 60 * 1000));
        
        // Calculer les heures, minutes et secondes restantes
        const remainingHours = endDate.getHours() - startDate.getHours();
        const remainingMinutes = endDate.getMinutes() - startDate.getMinutes();
        const remainingSeconds = endDate.getSeconds() - startDate.getSeconds();
        
        // Ajuster pour les valeurs négatives
        let adjustedHours = remainingHours;
        let adjustedMinutes = remainingMinutes;
        let adjustedSeconds = remainingSeconds;
        
        if (adjustedSeconds < 0) {
            adjustedSeconds += 60;
            adjustedMinutes--;
        }
        
        if (adjustedMinutes < 0) {
            adjustedMinutes += 60;
            adjustedHours--;
        }
        
        return {
            years,
            months,
            days: remainingDays,
            hours: adjustedHours,
            minutes: adjustedMinutes,
            seconds: adjustedSeconds,
            milliseconds: endDate.getMilliseconds() - startDate.getMilliseconds()
        };
    }
    
    /**
     * Calculer le dernier jour d'un mois
     * @param {number} year - Année
     * @param {number} month - Mois (0-11)
     * @returns {number} - Dernier jour du mois
     * @throws {RangeError} Si le mois n'est pas valide
     */
    static getLastDayOfMonthDate(year, month) {
        if (month < 0 || month > 11) {
            throw new RangeError('Le mois doit être compris entre 0 et 11');
        }
        
        return new Date(year, month + 1, 0).getDate();
    }
    
    /**
     * Vérifier la validité d'une date
     * @param {Date} date - Date à vérifier
     * @throws {TypeError} Si le paramètre n'est pas une date valide
     * @private
     */
    static _validateDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            throw new TypeError('Paramètre invalide : doit être une date valide');
        }
    }
}