var fs = require("fs")
var csv = require("fast-csv")

// paypal bookwork account (konto)
const FIDOR_ACCOUNT = 1200;

// eBay-Auktionszahlung, Einbehaltene Zahlung, Rückzahlung, ...
const TRANSACTION_TYPE = 3
// Name
const TRANSACTION_NAME = 1
// Info
const TRANSACTION_INFO = 2
// 07.02.18
const TRANSACTION_COMPLETE_DATE = 0
// 139,99
const TOTAL_ACTIVITY_VALUE = 3
// paypal fees
// const PAYPAL_FEES = 6
// DE, AT, CZ, ...
// const SALE_ARRIVAL_COUNTRY = 39

var count = 0;
var csvContent = [];
// var feesSum = 0;

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
  .fromPath(filePathName, { delimiter: ";" })
  .on("data", data => {
    // parse row
    let csvRow = parseCsv(data);
    if (csvRow) {
      csvContent.push(csvRow);
    }
  })
  .on("end", function () {
    // remove first line (header)
    csvContent.shift();

    // write new csv (DATEV) file
    let datevFile = "./DATEV_" + filePathName.replace(/^.*[\\\/]/, '');
    fs.writeFileSync(datevFile, csvContent.join("\n"))

    // done
    console.log(`DONE: \t"${filePathName}"`)
    console.log(`WRITE: \t"${datevFile}"`)
    console.log("3400 = " + a)
  });

let a = 0;
let b = 0;

function parseCsv(data) {
  // just sales and refunds
  // if (!(data[TRANSACTION_TYPE] === "SALE" || data[TRANSACTION_TYPE] === "REFUND")) {
  //   return;
  // }
  count += 1;

  let amount = parseFloat(data[TOTAL_ACTIVITY_VALUE].replace(".", "").replace(",", "."));
  // let fees = parseFloat(data[PAYPAL_FEES].replace(".", "").replace(",", "."));

  let nv = "";
  if ((data[TRANSACTION_NAME].startsWith("Gutschrift PayPal (Europe)"))) {
    nv = 1201;
  } else if ((data[TRANSACTION_NAME].toLowerCase().startsWith("gutschrift amazon payments europe"))) {
    nv = 1361;
  } else if ((data[TRANSACTION_NAME].startsWith("MasterCard Onlinekauf bei POSTPAY"))
  || (data[TRANSACTION_NAME].startsWith("MasterCard Onlinekauf bei Deutsche Post AG"))) {
    nv = 4910;
  } else if ((data[TRANSACTION_NAME].startsWith("MasterCard Onlinekauf bei") && amount < 0)
  || (data[TRANSACTION_NAME].startsWith("MasterCard Gutschrift in Höhe von") && amount > 0)) {
    nv = 3400;
    a++;
  }
  /*
  if (fees > 0 || fees < 0) {
    // if ((data[TRANSACTION_TYPE] === "eBay-Auktionszahlung" && amount > 0)
    //   || (data[TRANSACTION_TYPE] === "Rückzahlung" && amount < 0)) {
    // default German VAT
    nv = "8400";

    // other EU VAT
    // if (data[SALE_ARRIVAL_COUNTRY] !== "DE") {
    //   // VAT always 19%
    //   let vatGerman19Perc = true;

    //   switch (data[SALE_ARRIVAL_COUNTRY]) {
    //     case "AT": nv = vatGerman19Perc ? 8401 : 8129; break;
    //     case "FR": nv = vatGerman19Perc ? 8402 : 8125; break;
    //     case "IT": nv = vatGerman19Perc ? 8403 : 8126; break;
    //     case "ES": nv = vatGerman19Perc ? 8404 : 8127; break;
    //     case "GB": nv = vatGerman19Perc ? 8405 : 8128; break;
    //     default: nv = vatGerman19Perc ? 8406 : 8130; break;
    //   }
    // }
    a++;
    feesSum += fees;
  } else if (data[TRANSACTION_INFO] === "OnlineFrankierung.de@dhl.com") {
    // porto
    nv = 4910;
  } else if ((data[TRANSACTION_TYPE] === "eBay-Auktionszahlung" && amount < 0)
    || (data[TRANSACTION_TYPE] === "Rückzahlung" && amount > 0)
    || (data[TRANSACTION_INFO] === "COUPONEUR@ebay.com")) {
    // goods (Wareneingang)
    nv = 3400;
    b++;
  }
*/

  // create line for DATEV file
  let newLine = [];
  newLine.push(Math.abs(amount).toString().replace(".", ","))
  newLine.push(amount >= 0 ? "S" : "H")
  newLine.push("EUR")
  newLine.push("0")
  newLine.push("0")
  newLine.push("")
  newLine.push(FIDOR_ACCOUNT)
  newLine.push(nv)
  newLine.push("")
  newLine.push(parseInt(data[TRANSACTION_COMPLETE_DATE].split(".")[0]) + data[TRANSACTION_COMPLETE_DATE].split(".")[1])
  newLine.push(data[TRANSACTION_NAME])
  newLine.push("")
  newLine.push("0")
  newLine.push(data[TRANSACTION_INFO])
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