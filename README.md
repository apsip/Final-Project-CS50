# Tip Tracker Web App
### Video Demo:  <URL https://www.youtube.com/watch?v=DjAJXe3gHDk&ab_channel=AndrewSipovac>
### Description:
This is Trip Tracker! A simple, lightweight web application designed to help users(specifically
service industry workers) keep track of and manage their hours worked, cash tips and credit tips earned.
The application supports multiple jobs where the user can add, view, and analyze income data from their different jobs.

When accessing Tip Tracker a user is prompted to either log in or create an account. To create an account all you need to enter is your first, last name, email address and password. There are rules for the password: it must be between 4 and 20 characters. The password will be hashed and the hash will be stored in an SQL Database that will be used to authenticate you at log-in and be referenced when saving future jobs and the tips earned from the associated job.
After creating an account, you can now log-in. Once logged in, you will be at the home page where you can view current jobs, or add new ones. Once you do have a job added, you can then click on the job name and will be presented with two options: Log Income and View Income. When clicking on 'Log Income' you have the option to log income for 'Today' or 'Select Date' if you want to enter data from a previous date. The 'Today' button will have today's date presented below so the user knows that data is actually being entered for today.

After that you will be presented with a form that includes your hourly wage, cash tips, credit tips, start time, and end time. Currently, the application defaults to the California minimum wage of $15/hour, but can be easily changed by the user. The application will calculate your hourly wage by multiplying the 'Hourly Wage' entered in the log income form by the amount of hours worked determined from your start and end time. Once submitted, the application will add everything up and you will be presented with a 'Success' page and a short summary of the income earned form the shift you entered. And that's it!

Later, you can go back and select the job you want to view income for. On this page, you will be presented with all the income earned from the current month. It currently defaults to showing all income for current month. You can filter those results by the month of your choice, or any previous year the user chooses.

As for the tech used to complete this project: my app.js file is all written in Javascript and I'm using Express, Node.js and Mongoose for the server and database. I decided to use these because they seem to be some of the more popular tools used when building web applications today. They also are not too difficult to work with when starting from the knowledge I've gained from CS50. 'app.js' includes all of the routes for handling rendering all the different pages for the website. It also includes the logic for calculating the hourly wage, tips earned and the totaling everything up for each shift worked. One of the more changeling problems I had to solve was password hashing and authentication at log-in. Tools I had to learn how to use were passport and bcrypt to check the username and password in database and check it against the input from the user and to has the users password for security.

I used EJS to render all the pages. This way made it easier for me to include the header and footer everywhere as well as run javascript for things like dynamically loading the job names and dates on the data entry page. EJS was a very simple templating language to learn that made building the pages much easier.


