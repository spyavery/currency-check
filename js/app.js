/**
 * Author: Emmanuel SpyAvery Iyogun
 * Version: 1.0
 * Signature: spyavery
 */

'use strict';

$(document).ready(function (){
    fetchAllCurrencies();
});

/*
|------------------------------------------
| SERVICE WORKER SECTION
|------------------------------------------
*/
// Initiate SW
if(navigator.serviceWorker){

    registerServiceWorker();


    navigator.serviceWorker.addEventListener('controllerchange', function (){
        window.location.reload();
    });

}else{
    console.log('Service Worker Not Supported');
}

// Register SW
function registerServiceWorker() {

    navigator.serviceWorker.register('sw.js').then(function(sw) {

        if(!navigator.serviceWorker.controller) return;


        if(sw.waiting){

            sw.postMessage('message', { action: 'skipWaiting' });
            return;
        }


        if(sw.installing){
            trackInstalling(sw.installing);
        }


        sw.addEventListener('updatefound', function (){
            trackInstalling(sw.installing);
        });
    });
}

// Check SW Current State
function trackInstalling(worker) {
    worker.addEventListener('statechange', function(){
        if(worker.state == 'installed'){
            updateIsReady(worker);
        }
    });
}

// If New Updates Come Through
function updateIsReady(sw){

    pushUpdateFound();
}

// Notify about new updates
function pushUpdateFound() {
    $(".notify").fadeIn();
    console.log('Wow new update available.. !');
}



/*
|------------------------------------------
| INDEXED DB SECTION
|------------------------------------------
*/
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB");
}

// Open DB
function openDatabase(){

    const DB_NAME 	= 'ccheck';
    const database 	= indexedDB.open(DB_NAME, 2);

    // catch any error
    database.onerror = (event) => {
        console.log('Cant Open DB');
        return false;
    };

    // Version Check
    database.onupgradeneeded = function(event) {

        var upgradeDB = event.target.result;


        var objectStore = upgradeDB.createObjectStore("currencies");
    };


    return database;
}

//Update DB
function saveToDatabase(data){

    const db = openDatabase();

    //check DB tatus and if store already exist
    db.onsuccess = (event) => {


        const query = event.target.result;


        const currency = query.transaction("currencies").objectStore("currencies").get(data.symbol);

        //If successful
        currency.onsuccess = (event) => {
            const dbData = event.target.result;
            const store  = query.transaction("currencies", "readwrite").objectStore("currencies");

            if(!dbData){

                store.add(data, data.symbol);
            }else{

                store.put(data, data.symbol);
            };
        }
    }
}

// fetch from Indexed DB
function fetchFromDatabase(symbol, amount) {

    const db = openDatabase();

    //check DB tatus and if store already exist
    db.onsuccess = (event) => {


        const query = event.target.result;


        const currency = query.transaction("currencies").objectStore("currencies").get(symbol);

        // If Successful
        currency.onsuccess = (event) => {
            const data = event.target.result;

            if(data == null){
                $(".error_msg").append(`
					<div class="card-feel">
		                <span class="text-danger">
		                	Sorry We Cant Convert Right now, Kindly Try Again.
		                </span>
					</div>
				`);

                // hide error message
                setTimeout((e) => {
                    $(".error_msg").html("");
                }, 1000 * 3);

                // void
                return;
            }


            let pairs = symbol.split('_');
            let fr = pairs[0];
            let to = pairs[1];

            $(".results").append(`
				<div class="card-feel">
				<h1 class="small text-center"> <b>${amount}</b>  <b>${val.fr}</b> to <b>${val.to}</b> converted </h1>
					<hr />
	                Exchange rate for <b>${amount}</b> <b>${fr}</b> to <b>${to}</b> is: <br /> 
					<b>${numeral(amount * data.value).format('0.000')}</b>
				</div>
			`);
        }
    }
}

/*
|------------------------------------------
| API SECTION
|------------------------------------------
*/
// fetch all currencies
const fetchAllCurrencies = (e) => {
    // used es6 Arrow func here..
    $.get('https://free.currencyconverterapi.com/api/v5/currencies', (data) => {
        // if data not fetch
        if(!data) console.log("Cant get any data at this time, Try again!");

        // convert pairs to array
        const pairs = objectToArray(data.results);

        // used for of loop
        for(let val of pairs){
            // using template leteral
            $("#from-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
            $("#to-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
        }
    });
}

// convert currencies
function convertCurrency(){
    let from 	= $("#from-currency").val();
    let to 		= $("#to-currency").val();
    let amount	= $("#convert-amount").val();

    // restrict user for converting same currency
    if(from == to){
        // console.log('error ');
        $(".error_msg").html(`
			<div class="card-feel">
				<span class="text-danger">
					Sorry cant convert same currency!
				</span>
			</div>
		`);

        // hide error message
        setTimeout((e) => {
            $(".error_msg").html("");
        }, 1000 * 3);

        // stop proccess
        return false;
    }

    // build query
    let body  = `${from}_${to}`;
    let query = {
        q: body
    };

    // convert currencies
    $.get('https://free.currencyconverterapi.com/api/v5/convert', query, (data) => {
        // convert to array
        const pairs = objectToArray(data.results);

        // iterate pairs
        $.each(pairs, function(index, val) {
            $(".results").append(`
				<div class="card-feel">
				<h1 class="small text-center"> <b>${amount}</b>  <b>${val.fr}</b> to <b>${val.to}</b> converted </h1>
					<hr />
                   Exchange rate for <b>${amount}</b> <b>${val.fr}</b> to <b>${val.to}</b> is: <br /> 
					<b>${numeral(amount * val.val).format('0.000')}</b>
				</div>
			`);

            // save object results for later use
            let object = {
                symbol: body,
                value: val.val
            };

            // save to database
            saveToDatabase(object);
        });
    }).fail((err) => {
        // check currencies from indexedDB
        fetchFromDatabase(body, amount);
    });

    // void form
    return false;
}

// array generators using map & arrow func
function objectToArray(objects) {
    // body...
    const results = Object.keys(objects).map(i => objects[i]);
    return results;
}

// refresh page
function refreshPage() {
    // body...
    window.location.reload();
}
