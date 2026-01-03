// Timezone utility - Maps cities/countries to their timezone identifiers
const timezoneMap = {
  // Ireland
  'dublin': 'Europe/Dublin',
  'ireland': 'Europe/Dublin',
  'cork': 'Europe/Dublin',
  'galway': 'Europe/Dublin',
  
  // UK
  'london': 'Europe/London',
  'england': 'Europe/London',
  'uk': 'Europe/London',
  'united kingdom': 'Europe/London',
  'manchester': 'Europe/London',
  'birmingham': 'Europe/London',
  'scotland': 'Europe/London',
  'wales': 'Europe/London',
  
  // Europe - Western
  'paris': 'Europe/Paris',
  'france': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'germany': 'Europe/Berlin',
  'amsterdam': 'Europe/Amsterdam',
  'netherlands': 'Europe/Amsterdam',
  'brussels': 'Europe/Brussels',
  'belgium': 'Europe/Brussels',
  'madrid': 'Europe/Madrid',
  'spain': 'Europe/Madrid',
  'rome': 'Europe/Rome',
  'italy': 'Europe/Rome',
  'lisbon': 'Europe/Lisbon',
  'portugal': 'Europe/Lisbon',
  
  // Europe - Eastern
  'warsaw': 'Europe/Warsaw',
  'poland': 'Europe/Warsaw',
  'prague': 'Europe/Prague',
  'czech': 'Europe/Prague',
  'budapest': 'Europe/Budapest',
  'hungary': 'Europe/Budapest',
  'vienna': 'Europe/Vienna',
  'austria': 'Europe/Vienna',
  
  // Europe - Northern
  'stockholm': 'Europe/Stockholm',
  'sweden': 'Europe/Stockholm',
  'oslo': 'Europe/Oslo',
  'norway': 'Europe/Oslo',
  'copenhagen': 'Europe/Copenhagen',
  'denmark': 'Europe/Copenhagen',
  'helsinki': 'Europe/Helsinki',
  'finland': 'Europe/Helsinki',
  
  // USA - Eastern
  'new york': 'America/New_York',
  'boston': 'America/New_York',
  'philadelphia': 'America/New_York',
  'washington': 'America/New_York',
  'miami': 'America/New_York',
  
  // USA - Central
  'chicago': 'America/Chicago',
  'dallas': 'America/Chicago',
  'houston': 'America/Chicago',
  
  // USA - Mountain
  'denver': 'America/Denver',
  'phoenix': 'America/Phoenix',
  
  // USA - Pacific
  'los angeles': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  'seattle': 'America/Los_Angeles',
  'portland': 'America/Los_Angeles',
  
  // Canada
  'toronto': 'America/Toronto',
  'vancouver': 'America/Vancouver',
  'montreal': 'America/Toronto',
  'canada': 'America/Toronto',
  
  // Australia
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'brisbane': 'Australia/Brisbane',
  'perth': 'Australia/Perth',
  'australia': 'Australia/Sydney',
  
  // Asia
  'tokyo': 'Asia/Tokyo',
  'japan': 'Asia/Tokyo',
  'seoul': 'Asia/Seoul',
  'korea': 'Asia/Seoul',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'china': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'singapore': 'Asia/Singapore',
  'bangkok': 'Asia/Bangkok',
  'thailand': 'Asia/Bangkok',
  'dubai': 'Asia/Dubai',
  'uae': 'Asia/Dubai',
  'india': 'Asia/Kolkata',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  
  // South America
  'brazil': 'America/Sao_Paulo',
  'sao paulo': 'America/Sao_Paulo',
  'rio': 'America/Sao_Paulo',
  'argentina': 'America/Argentina/Buenos_Aires',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  
  // Africa
  'johannesburg': 'Africa/Johannesburg',
  'south africa': 'Africa/Johannesburg',
  'cairo': 'Africa/Cairo',
  'egypt': 'Africa/Cairo',
  'lagos': 'Africa/Lagos',
  'nigeria': 'Africa/Lagos',
  
  // Middle East
  'istanbul': 'Europe/Istanbul',
  'turkey': 'Europe/Istanbul',
  'moscow': 'Europe/Moscow',
  'russia': 'Europe/Moscow',
};

/**
 * Get timezone from location string
 * @param {string} location - Location string (city, country, etc.)
 * @returns {string} - Timezone identifier (e.g., 'Europe/Dublin') or 'UTC' if not found
 */
function getTimezoneFromLocation(location) {
  if (!location || typeof location !== 'string') {
    return 'UTC';
  }
  
  const normalized = location.toLowerCase().trim();
  
  // Direct match
  if (timezoneMap[normalized]) {
    return timezoneMap[normalized];
  }
  
  // Partial match - check if location contains any of the keys
  for (const [key, timezone] of Object.entries(timezoneMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return timezone;
    }
  }
  
  return 'UTC';
}

/**
 * Get human-readable timezone display name
 * @param {string} timezone - Timezone identifier (e.g., 'Europe/Dublin')
 * @returns {string} - Display name (e.g., 'GMT+0:00 (Europe/Dublin)')
 */
function getTimezoneDisplay(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value || '';
    return `${tzName} (${timezone})`;
  } catch (error) {
    return timezone;
  }
}

module.exports = {
  getTimezoneFromLocation,
  getTimezoneDisplay,
  timezoneMap
};
