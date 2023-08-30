const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
const axios=require('axios');

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

app.get('/', function (req,res){
res.sendFile(__dirname + '/public' + '/welcome.html') 
})

app.get('/signup', function (req, res) {  
res.render('signup', { message : null });

}) 

app.get('/login', function (req, res) {  
  res.render('login', { message: null });
})  


app.post('/onSignup', function (req, res) {
const data = req.body;
const email = req.body.email;
    console.log(data)
    db.collection('userData').where("email", "==", email).get()
    .then(querySnapshot=> {
      if (!querySnapshot.empty){
        res.render('signup', { message: "Email already exists. Please choose a different email." });
      }
      else{
        db.collection('userData').add(data)
          .then(() => {
            res.render('signup', { message: "Successfully signed up!" });
          })
          .catch(error=> {
            console.error("Error adding data:", error);
            res.render('signup', { message: "An error occurred while signing up." });
          });
      }
    })
    .catch(error=> {
        console.error("Error adding data:", error);
        res.render('signup', { message: "An error occurred while signing up." });
      });
});

app.post('/dashboard', function (req, res) {
const email = req.body.email;
const password = req.body.password;
    db.collection('userData').where("email", "==" , email).where("password", "==" ,password).get()
    .then(querySnapshot=> {
        if (!querySnapshot.empty){
          const data = querySnapshot.docs[0].data();
          const name = data.name;
          req.session.username = name;
          res.set('Cache-Control','no-store');
          res.render('dashboard', {username : name,message:null});        }
        else{
          res.render('login', { message: "Invalid email or password!" });        }
      })
      .catch(error=>{
        console.error("Error checking login:",error);
        res.render('login', { message: "An error occurred while checking login." });
      });
});

app.post('/searchCurrency', function (req, res) {
  const baseCurrency = req.body.baseCurrency;
  const targetCurrency = req.body.targetCurrency;
  const multiplier = parseFloat(req.body.multiplier);
  const name = req.session.username;
  axios.get(`https://exchange-rates.abstractapi.com/v1/live/?api_key=a42f203c97df4c62b7d2d7ee505e6616&base=${baseCurrency}&target=${targetCurrency}`)
    .then(response=> {
      console.log(response);
      const exchangeRates = response.data.exchange_rates;
      const exchangeRateValues = Object.values(exchangeRates);
      const multipliedExchangeRates = exchangeRateValues.map(rate=> rate * multiplier);
      const multipliedExchangeRateString = multipliedExchangeRates.join(", ");
      res.set('Cache-Control','no-store');
      res.render('dashboard', {multiplier: multiplier, baseCurrency: baseCurrency, targetCurrency: targetCurrency, username: name, message: multipliedExchangeRateString});
    })
    .catch(error=> {
      console.error("Error fetching exchange rates:", error);
      res.render('dashboard', { baseCurrency: baseCurrency, targetCurrency: targetCurrency, username: name, message: null });
    });
});
app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if(err){
      console.log(err);
      res.send("Error");
    }
    else{
      res.render('login',{message:"Logged out Successfully"})
    }
  })
})

  
app.listen(3000, ()=>{
    console.log('Server is running on port 3000');
  });