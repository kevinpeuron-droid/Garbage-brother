const fs = require('fs');

const code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const popupStart = code.indexOf('<Popup>');
const popupEnd = code.indexOf('</Popup>') + '</Popup>'.length;

const popupCode = code.slice(popupStart, popupEnd);

// console.log(popupCode);

