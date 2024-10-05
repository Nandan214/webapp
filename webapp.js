const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');



app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: '1@3$5^7*',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');


app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
})
app.get('/dashboard', function (req, res) {
  res.render('dashboard', { message: null });
})

app.post('/searchCurrency', async function (req, res) {
  const baseCurrency = req.body.baseCurrency;
  const targetCurrency = req.body.targetCurrency;
  const multiplier = parseFloat(req.body.multiplier);
  const name = req.session.username;
  const fromDate = new Date(req.body.fromDate);
  const toDate = new Date(req.body.toDate);

  const formattedFromDate = fromDate.toISOString().split('T')[0];
  const formattedToDate = toDate.toISOString().split('T')[0];

  const apiKey = 'GywS5C5IXv9x2LNzFDgY3hwQlO0f7rNr'; // Replace with your API key
  const apiUrl = `https://api.apilayer.com/exchangerates_data/timeseries?start_date=${formattedFromDate}&end_date=${formattedToDate}&base=${baseCurrency}&symbols=${targetCurrency}`;

  try {
    const myHeaders = new Headers();
    myHeaders.append("apikey", apiKey);

    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
      headers: myHeaders
    };

    const response = await fetch(apiUrl, requestOptions);
    const result = await response.json();

    if (result.success && result.timeseries) {
      const data = result.rates;
      const convertedData = {};

      Object.keys(data).forEach(date => {
        const exchangeRate = data[date][targetCurrency];
        const convertedValue = (multiplier * exchangeRate).toFixed(2);
        convertedData[date] = convertedValue;
      });

      res.set('Cache-Control', 'no-store');
      res.render('dashboard', { username: name, targetCurrency: targetCurrency, baseCurrency: baseCurrency, multiplier: multiplier, data: convertedData, message: true });
    } else {
      throw new Error('Failed to fetch currency data.');
    }
  } catch (error) {
    console.error("Error fetching currency data:", error);
    res.render('dashboard', { username: name, targetCurrency: targetCurrency, baseCurrency: baseCurrency, multiplier: multiplier, data: {}, message: "Error fetching currency data." });
  }
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
