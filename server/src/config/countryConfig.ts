export interface CountryEmergencyConfig {
  countryCode: string;
  countryName: string;
  emergencyNumber: string;
  ambulanceNumber: string;
  poisonControlNumber: string;
  poisonControlName: string;
}

export const COUNTRY_EMERGENCY_CONFIGS: Record<string, CountryEmergencyConfig> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    emergencyNumber: '112',
    ambulanceNumber: '102',
    poisonControlNumber: '1800-11-6117',
    poisonControlName: 'National Poisons Information Centre (AIIMS New Delhi)'
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    emergencyNumber: '911',
    ambulanceNumber: '911',
    poisonControlNumber: '1-800-222-1222',
    poisonControlName: 'Poison Help Line'
  },
  UK: {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    emergencyNumber: '999',
    ambulanceNumber: '999',
    poisonControlNumber: '111',
    poisonControlName: 'NHS 111 Medical Advice'
  }
};

export const getEmergencyContacts = (countryCode: string = 'IN'): CountryEmergencyConfig => {
  const code = countryCode.toUpperCase();
  return COUNTRY_EMERGENCY_CONFIGS[code] || COUNTRY_EMERGENCY_CONFIGS['IN'];
};
