// scripts/import-harbinger-csv.js
// Usage: node scripts/import-harbinger-csv.js "/path/to/harbinger_products.csv"

require('dotenv').config();

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('CSV path required.');
  process.exit(1);
}

import('../lib/harbinger/import-csv.js')
  .then(({ importHarbingerCsv }) => importHarbingerCsv(csvPath))
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
