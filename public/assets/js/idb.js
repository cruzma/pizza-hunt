//create varianble to hold DB connection
let db;

//estabvlish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('pizza_hunt');

// this evetn will emit if the databse version changes (nonexistant to  version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event){
    // save a reference to the database
    const db = event.target.result;
    //create an object store (table) called 'new_pizza', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_pizza', { autoIncrement: true });
}

//upon a succesful request
request.onsuccess = function(event){
    // when db is succesfully created with its object store (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable.
    db = event.target.result;

    //check if app is online, if yes run uploadPizza() function to send all local db data to api
    if(navigator.onLine){
        //we havent created this yet but we will soon, so lets comment it out for now 
        uploadPizza();
    }
};

request.onerror = function(event){
    //log error here
    console.log(event.target.errorCode);
}

//This function will be executed if we attempt to submit a new pizza and there is no internet connection
function saveRecord(record){
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access the object store for 'new_pizza'
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    pizzaObjectStore.add(record);
}

function uploadPizza(){
    //open a transaction on you db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access your object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    //get all records from store and set to a varaible
    const getAll = pizzaObjectStore.getAll();

    
    //upon a succesful .getAll() exectution, run this function
    getAll.onsuccess = function(){
        //if there wa data in indexedDB's store, lets send it to the api server
        if(getAll.result.length > 0){
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                //access the new_pizza object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                //clear all items in your store
                pizzaObjectStore.clear();

                alert('all saved pizza has been submitted');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }

}

// listen for app coming back online
window.addEventListener('online', uploadPizza);