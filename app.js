const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect('mongodb://localhost:27017/tips-database', {
});

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
});

userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//User model
const User = mongoose.model('User', userSchema);
module.exports = User;

//Tips model
const tipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobName: { type: String, required: true },
    date: { type: Date, required: true },
    hourlyWage: { type: Number, required: true },
    cashTips: { type: Number, required: true },
    creditTips: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    totalHours: { type: Number, required: true },
    totalIncome: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Tip = mongoose.model('Tip', tipSchema);
module.exports = Tip;
const ObjectId = mongoose.Types.ObjectId;


passport.use(new LocalStrategy(
    async function (username, password, done) {
        try {
            const user = await User.findOne({ email: username });

            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));


app.use(session({
    secret: 'secret-password',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 15 * 60 * 1000 }
}));

app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

//*********************** App Routes *****************************/


app.get('/login', function (req, res) {
    const isAuthenticated = req.isAuthenticated();
    res.render('login', { message: req.flash('error'), isAuthenticated });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true,
}));

app.get('/logout', function (req, res) {
    // Clear the session and redirect to the login page
    req.session.destroy();
    res.redirect('/login');
});

app.get('/create-account', function (req, res) {
    res.render('create-account', { isAuthenticated: false });
});

app.post('/create-account', async function (req, res) {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if the email is empty
        if (!email) {
            return res.status(400).send('Email is required');
        }

        // Check if the password is between 4 and 20 characters
        if (password.length < 4 || password.length > 20) {
            return res.status(400).send('Password must be between 4 and 20 characters');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in database
        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
        });

        // Save new user to database
        await newUser.save();

        // Redirect to the login page after successfully creating an account
        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


app.get('/home', async function (req, res) {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/login');
        }
        const userEmail = req.user.email;
        const user = await User.findOne({ email: userEmail });

        // If the user is not found:
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find all unique job names associated with the user's ID in the Tip schema
        const uniqueJobNames = await Tip.find({ user: user._id }).distinct('jobName');
        const isAuthenticated = req.isAuthenticated();

        res.render('home', { isAuthenticated, jobList: uniqueJobNames });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.post('/addJob', async function (req, res) {
    try {
        const newJob = req.body.newJob;
        const userEmail = req.user.email;
        const user = await User.findOne({ email: userEmail });
        // If the user is not found:
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Create a new Tip with the provided job name and associate it with the user
        const newTip = new Tip({
            jobName: newJob,
            user: user._id,
            totalIncome: 0,
            totalHours: 0,
            endTime: '00:00',
            startTime: '00:00',
            creditTips: 0,
            cashTips: 0,
            hourlyWage: 0,
            date: new Date(),
        });

        // Save newTip to database
        await newTip.save();
        res.redirect('/home');

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle job selection
app.get('/selectJob/:jobName', function (req, res) {
    const selectedJobName = req.params.jobName;
    const isAuthenticated = req.isAuthenticated();
    res.render('job-pages/job-template', { jobName: selectedJobName, isAuthenticated });
});

// Route to handle logging income for the selected job
app.get('/selectJob/:jobName/log-income', function (req, res) {
    const selectedJobName = req.params.jobName;
    const isAuthenticated = req.isAuthenticated();
    res.render('job-pages/log-income', { jobName: selectedJobName, isAuthenticated });
});

// Route to handle data entry for the selected job
app.get('/selectJob/:jobName/data-entry/:date', function (req, res) {
    const selectedJobName = req.params.jobName;
    const selectedDate = req.params.date;
    const isAuthenticated = req.isAuthenticated();
    res.render('job-pages/data-entry', { jobName: selectedJobName, date: selectedDate, isAuthenticated });
});

// Route to handle viewing income for the selected job
app.get('/selectJob/:jobName/view-income', async function (req, res) {
    const selectedJobName = req.params.jobName;
    const selectedMonth = req.query.month || null;
    // Default to the current year
    const selectedYear = req.query.year || (new Date()).getFullYear();

    try {
        let query = { jobName: selectedJobName };

        // If a specific month is selected, add it to the query
        let parsedMonth;

        if (selectedMonth !== null && selectedMonth !== undefined) {
            parsedMonth = parseInt(selectedMonth);
            if (!isNaN(parsedMonth)) {
                query.date = {
                    $gte: new Date(selectedYear, parsedMonth - 1, 1, 0, 0, 0),
                    $lt: new Date(selectedYear, parsedMonth, 1, 0, 0, 0)
                };
            } else {
                throw new Error('Invalid month');
            }
        } else {
            // If no specific month is selected, get data for the full year
            query.date = {
                $gte: new Date(selectedYear, 0, 1, 0, 0, 0),
                $lt: new Date(selectedYear + 1, 0, 1, 0, 0, 0)
            };
        }

        const userId = req.user._id;
        query.user = new ObjectId(userId);
        const tips = await Tip.find(query).populate('user');

        res.render('job-pages/view-income', {
            jobName: selectedJobName,
            tips,
            selectedMonth,
            selectedYear,
            isAuthenticated: req.isAuthenticated(),
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Function to calculate total income
function calculateTotalIncome(totalHours, hourlyWage, cashTips, creditTips) {
    // Calculate total income including hourly wage, cash tips, and credit tips
    const totalIncome = (totalHours * hourlyWage) + parseFloat(cashTips) + parseFloat(creditTips);
    const parsedTotalIncome = parseFloat(totalIncome);

    return parsedTotalIncome;
}

//Submit income to database
app.post('/submit-form', async (req, res) => {
    try {
        const {
            jobName,
            hourlyWage,
            cashTips,
            creditTips,
            startTime,
            endTime,
            date,
        } = req.body;

        // Check if user is authenticated
        if (!req.isAuthenticated()) {
            return res.status(401).send('Unauthorized');
        }
        const userId = req.user._id;
        const totalHours = calculateTotalHours(startTime, endTime);
        const totalHourlyAmount = totalHours * hourlyWage;

        // Round totalHourlyAmount to 2 decimal points
        const roundedTotalHourlyAmount = parseFloat(totalHourlyAmount.toFixed(2));

        // Calculate total income
        const totalIncome = calculateTotalIncome(totalHours, hourlyWage, cashTips, creditTips);

        // Round totalIncome to 2 decimal points
        const roundedTotalIncome = parseFloat(totalIncome.toFixed(2));

        // Create new Tip model with user info
        const newTip = new Tip({
            jobName,
            date,
            hourlyWage,
            cashTips,
            creditTips,
            startTime,
            endTime,
            totalHours,
            totalIncome,
            user: userId,
        });

        // Save newTip to database
        await newTip.save();

        // Parse the cashTips and creditTips as floats
        const parsedCashTips = parseFloat(cashTips);
        const parsedCreditTips = parseFloat(creditTips);

        // Calculate total tips
        const totalTips = parsedCashTips + parsedCreditTips + roundedTotalHourlyAmount;

        // Round totalTips to 2 decimal points
        const roundedTotalTips = parseFloat(totalTips.toFixed(2));

        res.render('submit-form', {
            jobName,
            date,
            totalIncome: roundedTotalIncome,
            cashTips: parsedCashTips,
            creditTips: parsedCreditTips,
            roundedTotalHourlyAmount,
            totalTips: roundedTotalTips,
            isAuthenticated: req.isAuthenticated(),
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Function to calculate total hours worked
function calculateTotalHours(startTime, endTime) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const totalHours = totalMinutes / 60;
    const roundedTotalHours = parseFloat(totalHours.toFixed(2));

    return roundedTotalHours;
}

app.listen(3000, function () {
    console.log("Server started on port 3000");
});