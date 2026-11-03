import { useEffect, useMemo, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

const flag = (country) => country.replace(/./g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
const countryName = (country) => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(country) || country; } catch { return country; }
};

const countries = getCountries().map((country) => ({
  country,
  code: getCountryCallingCode(country),
  label: countryName(country)
})).sort((a, b) => a.label.localeCompare(b.label));

export default function PhoneInput({ value, onChange, required = false, autoComplete = 'tel', id = 'phone', name = 'phone' }) {
  const parsed = useMemo(() => value ? parsePhoneNumberFromString(value) : null, [value]);
  const [country, setCountry] = useState(parsed?.country || 'IN');
  const [number, setNumber] = useState(parsed?.nationalNumber || '');

  useEffect(() => {
    const next = value ? parsePhoneNumberFromString(value) : null;
    if (next?.country && next.nationalNumber !== number) {
      setCountry(next.country);
      setNumber(next.nationalNumber);
    } else if (!value && number) setNumber('');
  }, [value, number]);

  const update = (nextCountry, nextNumber) => {
    const parsedNumber = parsePhoneNumberFromString(nextNumber, nextCountry);
    onChange(parsedNumber?.number || nextNumber ? `+${getCountryCallingCode(nextCountry)}${nextNumber.replace(/\D/g, '')}` : '');
  };
  const changeCountry = (event) => {
    const nextCountry = event.target.value;
    setCountry(nextCountry);
    update(nextCountry, number);
  };
  const changeNumber = (event) => {
    const nextNumber = event.target.value;
    setNumber(nextNumber);
    update(country, nextNumber);
  };

  return <div className="phone-input">
    <select value={country} onChange={changeCountry} aria-label="Country code" className="phone-country">
      {countries.map((item) => <option key={item.country} value={item.country}>{flag(item.country)} {item.label} (+{item.code})</option>)}
    </select>
    <span className="phone-code" aria-hidden="true">+{getCountryCallingCode(country)}</span>
    <input id={id} name={name} type="tel" value={number} onChange={changeNumber} required={required} autoComplete={autoComplete} inputMode="tel" aria-label="Phone number" placeholder="Phone number" />
  </div>;
}
