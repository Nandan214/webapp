const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

var serviceAccount = require("./db.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: '1@3$5^7*',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public' + '/welcome.html')
})

app.get('/signup', function (req, res) {
  res.render('signup', { message: null });
})

app.get('/login', function (req, res) {
  res.render('login', { message: null });
})


  app.post('/onSignup', function (req, res) {
    const data = req.body;
    const email = req.body.email;
    console.log(data)
    db.collection('userData').where("email", "==", email).get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          res.render('signup', { message: "Email already exists. Please choose a different email." });
        } 
        else {
          db.collection('userData').add(data)
            .then(() => {
              res.render('signup', { message: "Successfully signed up!" });
            })
            .catch(error => {
              console.error("Error adding data:", error);
              res.render('signup', { message: "An error occurred while signing up." });
            });
        }
      })
      .catch(error => {
        console.error("Error adding data:", error);
        res.render('signup', { message: "An error occurred while signing up." });
      });
  });

  app.post('/dashboard', function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    db.collection('userData').where("email", "==", email).where("password", "==", password).get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          const name = data.name;
          req.session.username = name;
          res.set('Cache-Control', 'no-store');
          res.render('dashboard', { username: name,message:null});
        }
        else {
          res.render('login', { message: "Invalid email or password!" });
        }
      })
      .catch(error => {
        console.error("Error checking login:", error);
        res.render('login', { message: "An error occurred while checking login." });
      });
  });

  app.post('/searchCurrency', function (req, res) {
    const baseCurrency = req.body.baseCurrency;
    const targetCurrency = req.body.targetCurrency;
    const multiplier = parseFloat(req.body.multiplier);
    const name = req.session.username;
    const fromDate = new Date(req.body.fromDate);
    const toDate = new Date(req.body.toDate);

    const formattedFromDate = fromDate.toISOString().split('T')[0];
    const formattedToDate = toDate.toISOString().split('T')[0];

    const apiKey = 'fca_live_0lx7SkKNx5S8zFivGKfNjPU5LZJlUcQQ9xOacf0K'; 
    const apiUrl = `https://api.freecurrencyapi.com/v1/historical?apikey=${apiKey}&currencies=${targetCurrency}&base_currency=${baseCurrency}&date_from=${formattedFromDate}T00%3A00%3A00Z&date_to=${formattedToDate}T00%3A00%3A00Z`;

    axios.get(apiUrl)
        .then(response => {
            const data = response.data.data;
            const convertedData = {};

            Object.keys(data).forEach(date => {
                const exchangeRate = data[date][targetCurrency];
                const convertedValue = (multiplier * exchangeRate).toFixed(2);
                convertedData[date] = convertedValue;
            });
            console.log(convertedData)
            res.render('dashboard', { username: name, targetCurrency: targetCurrency, baseCurrency: baseCurrency, multiplier: multiplier, data: convertedData, message: true});
        })
        .catch(error => {
            console.error("Error fetching currency data:", error);
            res.render('dashboard', { username: name, targetCurrency: targetCurrency, baseCurrency: baseCurrency, multiplier: multiplier, data: {},message:"Error fetching currency data:" });
        });
});


app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if(err) {
      console.log(err);
      res.send("Error");
    }
    else{
      res.render('login', { message: "Logged out Successfully" });
    }
  })
})

app.listen(3000,() =>{
  console.log('Server is running on port 3000');
});
