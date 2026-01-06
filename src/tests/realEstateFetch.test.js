import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRentCastValue } from '../lib/realEstateAPI';

describe('realEstateAPI - fetchRentCastValue', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should throw error if address or apiKey missing', async () => {
        await expect(fetchRentCastValue('', 'key')).rejects.toThrow('Address and API Key are required');
        await expect(fetchRentCastValue('addr', '')).rejects.toThrow('Address and API Key are required');
    });

    it('should return price on success', async () => {
        const mockResponse = { price: 500000 };
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const result = await fetchRentCastValue('123 Main St', 'valid-key');
        expect(result.price).toBe(500000);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('123%20Main%20St'),
            expect.objectContaining({
                headers: { 'X-Api-Key': 'valid-key', 'Accept': 'application/json' }
            })
        );
    });

    it('should handle 401/403 Invalid Key', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ message: 'Unauthorized' })
        });

        await expect(fetchRentCastValue('addr', 'bad-key')).rejects.toThrow('Invalid RentCast API Key');
    });

    it('should handle 404 Not Found', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ message: 'Not Found' })
        });

        await expect(fetchRentCastValue('fake-addr', 'key')).rejects.toThrow('Property not found');
    });

    it('should handle missing price in response', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ price: null })
        });

        const result = await fetchRentCastValue('addr', 'key');
        expect(result.price).toBeNull();
        expect(result.message).toContain('no price estimate available');
    });
});
