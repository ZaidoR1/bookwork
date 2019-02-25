var fs = require("fs")
var csv = require("fast-csv")

// amazon.de, amazon.fr, ...
const MARKETPLACE = 3
// SALE, REFUND, ...
const TRANSACTION_TYPE = 4
// 306-8244396-9801928 (order id)
const TRANSACTION_EVENT_ID = 5
// 23-01-2018
const TRANSACTION_COMPLETE_DATE = 10
// 139.99
const TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL = 51
// EUR
const TRANSACTION_CURRENCY_CODE = 52
// DE, AT, CZ, ...
const SALE_ARRIVAL_COUNTRY = 67
// VAT (19%, 0%, ...)
const PRICE_OF_ITEMS_VAT_RATE_PERCENT = 30

// folder for amazon transaction files
const DIR_AMAZON = "./amazon/";
// folder for DATEV files
const DIR_DATEV = "./datev/";

var count = 0;
var csvContent = [];

// get args (file name)
// eg "node index.js /path/to/file"
let arg = process.argv.slice(2);
if (arg.length === 0) {
  console.log("parameter missing: filename")
  return;
}

let filePathName = arg[0]
console.log(`READ: \t"${filePathName}"`)

// open stream for file
var csvStream = csv
  .fromPath(filePathName, { delimiter: "\t" })
  .on("data", data => {
    // parse row
    let csvRow = parseCsv(data);
    if (csvRow) {
      csvContent.push(csvRow);
    }
  })
  .on("end", function () {
    // write new csv (DATEV) file
    let datevFile = "./DATEV_" + filePathName.replace(/^.*[\\\/]/, '');
    datevFile = datevFile.substr(0, datevFile.lastIndexOf(".")) + ".csv";
    fs.writeFileSync(datevFile, csvContent.join("\n"))

    // done
    console.log(`DONE: \t"${filePathName}"`)
    console.log(`WRITE: \t"${datevFile}"`)
  });

function parseCsv(data) {
  // just sales and refunds
  if (!(data[TRANSACTION_TYPE] === "SALE" || data[TRANSACTION_TYPE] === "REFUND")) {
    return;
  }
  count += 1;

  // marketplace bookwork account (konto)
  let marketplaceAccount = "";
  switch (data[MARKETPLACE]) {
    case "amazon.de": marketplaceAccount = 1202; break;
    case "amazon.fr": marketplaceAccount = 1203; break;
    case "amazon.it": marketplaceAccount = 1204; break;
    case "amazon.es": marketplaceAccount = 1205; break;
    case "amazon.co.uk": marketplaceAccount = 1206; break;
  }

  // default German VAT
  // other EU VAT
  let nv = "8400";
  if (data[SALE_ARRIVAL_COUNTRY] !== "DE") {
    // check if VAT 19% oder 0%
    let vatGerman19Perc = parseFloat(data[PRICE_OF_ITEMS_VAT_RATE_PERCENT]) !== 0;

    switch (data[SALE_ARRIVAL_COUNTRY]) {
      case "AT": nv = vatGerman19Perc ? 8401 : 8129; break;
      case "FR": nv = vatGerman19Perc ? 8402 : 8125; break;
      case "IT": nv = vatGerman19Perc ? 8403 : 8126; break;
      case "ES": nv = vatGerman19Perc ? 8404 : 8127; break;
      case "GB": nv = vatGerman19Perc ? 8405 : 8128; break;
      default: nv = vatGerman19Perc ? 8406 : 8130; break;
    }
  }

  // create line for DATEV file
  let newLine = [];
  newLine.push(Math.abs(data[TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL]).toString().replace(".", ","))
  newLine.push((data[TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL] >= 0 ? "S" : "H"))
  newLine.push(data[TRANSACTION_CURRENCY_CODE])
  newLine.push("0")
  newLine.push("0")
  newLine.push("")
  newLine.push(marketplaceAccount)
  newLine.push(nv)
  newLine.push("0")
  newLine.push(parseInt(data[TRANSACTION_COMPLETE_DATE].split("-")[0]) + data[TRANSACTION_COMPLETE_DATE].split("-")[1])
  newLine.push(data[TRANSACTION_EVENT_ID])
  newLine.push("")
  newLine.push("0")
  newLine.push(`${data[MARKETPLACE]} > ${data[SALE_ARRIVAL_COUNTRY]}`)
  newLine.push("0")
  newLine.push("")
  newLine.push("0")
  newLine.push("0")
  newLine.push("0")
  newLine.push("")
  newLine.push("")
  newLine.push("")

  console.log(`${count}: \t${newLine.join("\t")}`)
  return newLine.join(";");
}