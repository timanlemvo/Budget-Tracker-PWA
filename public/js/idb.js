let db;
// establish a connection to IndexedDB database 
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
	const db = event.target.result;
	db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
	db = event.target.result;

	if (navigator.onLine) {
		uploadTransaction();
	}
};

request.onerror = function (event) {
	console.log(event.target.errorCode);
};

// Will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
	const transaction = db.transaction(["new_transaction"], "readwrite");
	const transactionObjectStore = transaction.objectStore("new_transaction");

	transactionObjectStore.add(record);
}

// function that will handle collecting all of the data 
function uploadTransaction() {
	const transaction = db.transaction(["new_transaction"], "readwrite");
	const transactionObjectStore = transaction.objectStore("new_transaction");
	const getAll = transactionObjectStore.getAll();

	getAll.onsuccess = function () {
		if (getAll.result.length > 0) {
			fetch("/api/transaction", {
				method: "POST",
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
				.then((response) => response.json())
				.then((serverResponse) => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
					}
					const transaction = db.transaction(["new_transaction"], "readwrite");
					const transactionObjectStore = transaction.objectStore("new_transaction");
					transactionObjectStore.clear();

					alert("All saved transactions have been submitted!");
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};
}

window.addEventListener('online', uploadTransaction);
