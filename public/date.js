// script.js

function displayToday() {
    var todayDate = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var formattedDate = todayDate.toLocaleDateString('en-US', options);
    document.getElementById('todayDateContainer').innerHTML = formattedDate;
}
