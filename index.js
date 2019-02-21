var fs = require("fs")
var csv = require("fast-csv")
var mkdirp = require('mkdirp')

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

// folder for amazon transaction files
const DIR_AMAZON = "./amazon/";
// folder for DATEV files
const DIR_DATEV = "./datev/";

var count = 0;
var csvContent = [];

// read amazon transaction file
fs.readdirSync(DIR_AMAZON).forEach(file => {
  console.log(`reading file "${file}"`)
  if (!file.endsWith(".txt")) {
    console.log(`skipping file "${file}"`)
  }

  var stream = fs.createReadStream(DIR_AMAZON + file);
  var csvStream = csv
    .fromStream(stream, { delimiter: "\t" })
    .on("data", data => {
      // parse row
      let csvRow = parseCsv(file, data);
      if (csvRow) {
        csvContent.push(csvRow);
        console.log(csvContent.length)
      }
    })
    .on("end", function () {
      // create directory if not exists
      mkdirp(DIR_DATEV)

      // write new csv (DATEV) file
      fs.writeFileSync(DIR_DATEV + "DATEV_" + file.split(".")[0] + ".csv", csvContent.join("\n"))

      console.log(`finished file "${file}"`)
    });
})

function parseCsv(file, data) {
  // just sales and refunds
  if (!(data[TRANSACTION_TYPE] === "SALE" || data[TRANSACTION_TYPE] === "REFUND")) {
    return;
  }

  count += 1;
  console.log(
    count.pad(3) + ":",
    data[MARKETPLACE],
    data[TRANSACTION_TYPE],
    data[TRANSACTION_EVENT_ID],
    data[TRANSACTION_COMPLETE_DATE],
    data[TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL],
    data[TRANSACTION_CURRENCY_CODE],
    data[SALE_ARRIVAL_COUNTRY]
  );

  // create line for DATEV file
  let newLine = [];
  newLine.push(Math.abs(data[TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL]).toString().replace(".", ","))
  newLine.push((data[TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL] >= 0 ? "S" : "H"))
  newLine.push(data[TRANSACTION_CURRENCY_CODE])
  newLine.push("0")
  newLine.push("0")
  newLine.push("")
  newLine.push("1202")
  newLine.push("")
  newLine.push("0")
  newLine.push(parseInt(data[TRANSACTION_COMPLETE_DATE].split("-")[0]) + data[TRANSACTION_COMPLETE_DATE].split("-")[1])
  newLine.push(data[TRANSACTION_EVENT_ID])
  newLine.push("")
  newLine.push("0")
  newLine.push(data[MARKETPLACE])
  newLine.push("0")
  newLine.push("")
  newLine.push("0")
  newLine.push("0")
  newLine.push("0")
  newLine.push("")
  newLine.push("")
  newLine.push("")

  console.log(newLine.join(" ") + "\n")
  return newLine.join(";");
}

Number.prototype.pad = function (size) {
  var s = String(this);
  while (s.length < (size || 2)) { s = "0" + s; }
  return s;
}