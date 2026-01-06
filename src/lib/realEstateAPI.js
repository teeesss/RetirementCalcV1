/**
 * Real Estate API Client for RentCast
 */

export async function fetchRentCastValue(address, apiKey) {
    if (!address || !apiKey) {
        throw new Error('Address and API Key are required');
    }

    try {
        const resp = await fetch(`https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) {
                throw new Error('Invalid RentCast API Key. Please check your settings.');
            }
            if (resp.status === 404) {
                throw new Error('Property not found. Try a more specific address including Zip code.');
            }
            const errorData = await resp.json().catch(() => ({}));
            throw new Error(errorData.message || `RentCast Error: ${resp.status}`);
        }

        const data = await resp.json();
        if (!data || !data.price) {
            return { price: null, message: "Property found but no price estimate available." };
        }

        return { price: data.price };
    } catch (e) {
        console.error('Real Estate API Error:', e);
        throw e;
    }
}

/**
 * Validate RentCast API Key
 */
export async function validateRentCastKey(apiKey) {
    if (!apiKey) throw new Error('API Key is required');

    try {
        // We make a request to a cheap endpoint to check key validity
        // Using a random but valid-format address to see if we get a 401 or something else
        const resp = await fetch(`https://api.rentcast.io/v1/avm/value?address=123%20Main%20St`, {
            headers: { 'X-Api-Key': apiKey }
        });

        if (resp.status === 401 || resp.status === 403) {
            return { valid: false, message: 'Invalid API Key' };
        }

        // Any other status (including 404 or 200) means the key itself is authorized
        return { valid: true, status: resp.status };
    } catch (e) {
        return { valid: false, message: e.message };
    }
}
