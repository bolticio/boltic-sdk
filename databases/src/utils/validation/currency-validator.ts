import { HttpAdapter } from '../http/adapter';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export class CurrencyValidator {
  private httpAdapter: HttpAdapter;
  private baseURL: string;
  private apiKey: string;
  private cache: Map<string, Currency[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(httpAdapter: HttpAdapter, baseURL: string, apiKey: string) {
    this.httpAdapter = httpAdapter;
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private async fetchCurrencies(): Promise<Currency[]> {
    try {
      const response = await this.httpAdapter.request({
        url: `${this.baseURL}/tables/currencies`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.apiKey,
        },
        timeout: 10000,
      });

      if ((response.data as { data?: Currency[] })?.data) {
        const data = (response.data as { data: Currency[] }).data;
        if (typeof data === 'object' && !Array.isArray(data)) {
          return Object.entries(data).map(([code, currency]) => {
            const currencyObj = currency as {
              name?: string;
              grapheme?: string;
              symbol?: string;
            };
            return {
              code: code.toUpperCase(),
              name: currencyObj.name || code,
              symbol: currencyObj.grapheme || currencyObj.symbol || code,
            };
          });
        }
        if (Array.isArray(data)) {
          return data;
        }
      }
      return this.getCommonCurrencies();
    } catch (error) {
      console.warn('Failed to fetch currencies from API, using fallback list');
      return this.getCommonCurrencies();
    }
  }

  private getCommonCurrencies(): Currency[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    ];
  }

  async getCurrencies(): Promise<Currency[]> {
    const cacheKey = 'currencies';
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && now < expiry) {
      return cached;
    }

    const currencies = await this.fetchCurrencies();
    this.cache.set(cacheKey, currencies);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    return currencies;
  }

  async validateCurrencyCode(
    currencyCode: string
  ): Promise<CurrencyValidationResult> {
    if (!currencyCode || typeof currencyCode !== 'string') {
      return {
        isValid: false,
        error: 'Currency code must be a non-empty string',
      };
    }

    const normalizedCode = currencyCode.toUpperCase().trim();

    if (normalizedCode.length !== 3) {
      return {
        isValid: false,
        error: 'Currency code must be exactly 3 characters',
        suggestion:
          'Use standard 3-letter currency codes (e.g., USD, EUR, GBP)',
      };
    }

    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
      return {
        isValid: false,
        error: 'Currency code must contain only uppercase letters',
        suggestion: 'Use only uppercase letters (e.g., USD, EUR, GBP)',
      };
    }

    const currencies = await this.getCurrencies();
    const currency = currencies.find((c) => c.code === normalizedCode);

    if (!currency) {
      const suggestions = currencies
        .filter(
          (c) =>
            c.code.includes(normalizedCode) ||
            c.name.toUpperCase().includes(normalizedCode)
        )
        .slice(0, 3)
        .map((c) => c.code);

      return {
        isValid: false,
        error: `Currency code '${normalizedCode}' is not supported`,
        suggestion:
          suggestions.length > 0
            ? `Did you mean: ${suggestions.join(', ')}?`
            : 'Use a supported currency code',
      };
    }

    return {
      isValid: true,
    };
  }

  async getAvailableCurrencies(): Promise<Currency[]> {
    return this.getCurrencies();
  }

  async getCurrencyDetails(currencyCode: string): Promise<Currency | null> {
    const currencies = await this.getCurrencies();
    return (
      currencies.find((c) => c.code === currencyCode.toUpperCase()) || null
    );
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export function createCurrencyValidator(
  httpAdapter: HttpAdapter,
  baseURL: string,
  apiKey: string
): CurrencyValidator {
  return new CurrencyValidator(httpAdapter, baseURL, apiKey);
}
