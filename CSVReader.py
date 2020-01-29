import csv
with open(r'C:\Users\josep\Google Drive\Prog\javascript\trumpTweets.csv') as csvFile:
    freqTweets = csv.reader(csvFile, delimiter=',', quotechar='|')
    formatted = ''
    for row in freqTweets:
        formatted += '{"Name":' + row[0] + ',Count:' + row[1] + '}, '
    print(formatted)