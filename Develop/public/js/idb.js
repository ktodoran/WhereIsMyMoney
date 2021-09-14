// Variable to Hold DB Connection
let db;
// Establish connection to DB called "budget" with Version set to 2.0
const request = indexedDB.open('budget', 2.0);

// this event will emit database changes
request.onupgradeneeded = function (event) {
    // save reference to the database
    const db = event.target.result;
    // create an object store called 'new_input', set it to have an auto incrementing primary key
    db.createObjectStore('new_input', { autoIncrement: true });
};

// upon a successful request
request.onsuccess = function (event) {
    // when db is successfully created with it's object store (from onupgradedneeded event) or an established connection happens, save reference to db in global variable
    db = event.target.result;

    // If App is online, run refreshBudget();
    if (navigator.onLine) {
        refreshBudget();
    }
};

request.onerror = function (event) {
    // Log Error
    console.log(event.target.errorCode);
};

// Function to save record with offline connection
function allowRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_input'], 'readwrite');

    // access the object store for `new_input`
    const inputObjectStore = transaction.objectStore('new_input');

    // add record to your store with add method
    inputObjectStore.add(record)
}

function refreshBudget() {
    console.log("refreshBudget")
    //Open a Transaction on DB
    const transaction = db.transaction(['new_input'], 'readwrite');

    // Access Object Store
    const inputStore = transaction.objectStore('new_input');

    //Grab Records from store, and set them
    const getAll = inputStore.getAll();

    // upon successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        console.log(getAll);
        // if there was data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {

            // TODO: NEED TO CHECK CODE HERE  !!!!!
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    console.log(serverResponse);

                    // open one more transaction
                    const transaction = db.transaction(['new_input'], 'readwrite');
                    // access the new_input object store
                    const inputObjectStore = transaction.objectStore('new_input');
                    // clear all items in your store
                    inputObjectStore.clear();

                    alert('All saved transactions has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', refreshBudget);
