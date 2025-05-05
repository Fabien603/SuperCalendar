// Utilitaires pour manipuler les dates
export class DateUtils {
    // Formater une date au format ISO (YYYY-MM-DD)
    static formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Formater une date au format local (JJ/MM/YYYY)
    static formatLocalDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${day}/${month}/${year}`;
    }
    
    // Formater une heure au format 24h (HH:MM)
    static formatTime24h(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // Formater une heure au format 12h (HH:MM AM/PM)
    static formatTime12h(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // L'heure '0' doit être '12'
        const hoursStr = hours.toString().padStart(2, '0');
        
        return `${hoursStr}:${minutes} ${ampm}`;
    }
    
    // Formater une date et heure complète
    static formatDateTime(date, timeFormat = '24h') {
        const localDate = this.formatLocalDate(date);
        const time = timeFormat === '24h' ? this.formatTime24h(date) : this.formatTime12h(date);
        return `${localDate} ${time}`;
    }
    
    // Vérifier si deux dates représentent le même jour
    static isSameDay(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }
    
    // Récupérer le nombre de jours dans un mois
    static getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
    
    // Récupérer le premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    static getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }
    
    // Récupérer le dernier jour du mois
    static getLastDayOfMonth(year, month) {
        return new Date(year, month + 1, 0).getDay();
    }
    
    // Récupérer le début de la semaine pour une date donnée (par défaut, la semaine commence le lundi)
    static getStartOfWeek(date, startDay = 1) {
        const day = date.getDay();
        const diff = (day < startDay ? 7 : 0) + day - startDay;
        const startDate = new Date(date);
        startDate.setDate(date.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        return startDate;
    }
    
    // Récupérer la fin de la semaine pour une date donnée
    static getEndOfWeek(date, startDay = 1) {
        const startOfWeek = this.getStartOfWeek(date, startDay);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    }
    
    // Récupérer le début du mois
    static getStartOfMonth(date) {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return startOfMonth;
    }
    
    // Récupérer la fin du mois
    static getEndOfMonth(date) {
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return endOfMonth;
    }
    
    // Récupérer le début de l'année
    static getStartOfYear(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        return startOfYear;
    }
    
    // Récupérer la fin de l'année
    static getEndOfYear(date) {
        const endOfYear = new Date(date.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return endOfYear;
    }
    
    // Ajouter des jours à une date
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    // Ajouter des mois à une date
    static addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }
    
    // Ajouter des années à une date
    static addYears(date, years) {
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    }
    
    // Calculer la différence en jours entre deux dates
    static diffInDays(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000; // heures * minutes * secondes * millisecondes
        const diffTime = Math.abs(date2 - date1);
        return Math.round(diffTime / oneDay);
    }
    
    // Calculer la différence en semaines entre deux dates
    static diffInWeeks(date1, date2) {
        return Math.floor(this.diffInDays(date1, date2) / 7);
    }
    
    // Calculer la différence en mois entre deux dates
    static diffInMonths(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const yearsDiff = d2.getFullYear() - d1.getFullYear();
        const monthsDiff = d2.getMonth() - d1.getMonth();
        return yearsDiff * 12 + monthsDiff;
    }
    
    // Calculer la différence en années entre deux dates
    static diffInYears(date1, date2) {
        return date2.getFullYear() - date1.getFullYear();
    }
    
    // Vérifier si une date est dans le passé
    static isPast(date) {
        return date < new Date();
    }
    
    // Vérifier si une date est dans le futur
    static isFuture(date) {
        return date > new Date();
    }
    
    // Vérifier si une date est aujourd'hui
    static isToday(date) {
        return this.isSameDay(date, new Date());
    }
    
    // Vérifier si une année est bissextile
    static isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }
    
    // Récupérer le numéro de la semaine dans l'année
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    // Récupérer le nom du jour de la semaine
    static getDayName(date, locale = 'fr-FR', format = 'long') {
        return date.toLocaleDateString(locale, { weekday: format });
    }
    
    // Récupérer le nom du mois
    static getMonthName(date, locale = 'fr-FR', format = 'long') {
        return date.toLocaleDateString(locale, { month: format });
    }
    
    // Analyser une chaîne de date au format ISO (YYYY-MM-DD)
    static parseISODate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
    }
    
    // Analyser une chaîne de date au format local (JJ/MM/YYYY)
    static parseLocalDate(dateStr) {
        const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
    }
    
    // Obtenir une date avec l'heure à 00:00:00
    static startOfDay(date) {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    
    // Obtenir une date avec l'heure à 23:59:59
    static endOfDay(date) {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }
}