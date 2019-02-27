# Bookwork / Buchhaltung
Creates DATEV-File for Amazon

```
node index.js /path/to/amazon_transaction_file/14487840203017910.txt
```

## to iterate over a year (if you have renamed your files with dates)
```
for i in {01..12}; do node index.js "/path/to/amazon_transaction_file/2018_${i}_amazon_transactions.txt"; done
```
