export const fmt = n => 'Rs. ' + Math.round(n).toLocaleString('en-IN');

export const fmtShort = n => {
  if (Math.abs(n) >= 10000000) return 'Rs. ' + (n / 10000000).toFixed(2) + ' Cr';
  if (Math.abs(n) >= 100000)   return 'Rs. ' + (n / 100000).toFixed(2) + ' L';
  if (Math.abs(n) >= 1000)     return 'Rs. ' + (n / 1000).toFixed(1) + 'k';
  return 'Rs. ' + n;
};
