const intuit_apikey = window.__shellInternal.appExperience.appApiKey;

const today = new Date();

async function main() {
	// Output for console used in various places
	let output;

	// Get bills
	const bills_data = await fetch(
		'https://mint.intuit.com/bps/v2/payer/bills',
		{
			headers: {
				accept: 'application/json',
				authorization:
					'Intuit_APIKey intuit_apikey=' +
					intuit_apikey +
					', intuit_apikey_version=1.0',
				'cache-control': 'no-cache',
				pragma: 'no-cache',
			},
		}
	).then((response) => response.json());

	const bills = [];
	for (const bill of bills_data.bills) {
		const date_object = Date.parse(bill.statementDate);
		const elapsed = (today - date_object) / 86400000; // divide by milliseconds in a day

		// More than 60 days ago? Skip it
		if (elapsed > 120) {
			continue;
		}

		const name = bill.providerRef.providerName;
		const number = bill.lastDigits;
		const key = name + ':' + number;
		let statementBalance = bill.statementAmount;

		// Fix issue with statement balance being incorrect sometimes when actually balance is 0
		const totalBalance =
			bill?.billDetailsList?.[0]?.availableBalanceAmount ?? null;
		if (0 === totalBalance) {
			statementBalance = 0;
		}

		if (key in bills) {
			const existing_date = Date.parse(bills[key].statementDate);
			if (existing_date > date_object) {
				continue;
			}
		}

		bills[key] = {
			statementDate: bill.statementDate,
			dueDate: bill.dueDate,
			statementBalance: statementBalance,
			totalBalance: totalBalance,
			billStatus: bill.billStatus,
			name,
			number,
		};
	}

	console.clear();
	console.log('------------------------------------------------');
	console.log('Statements / Bills');
	console.log('------------------------------------------------');
	console.table(bills);

	console.log('------------------------------------------------');
	console.log('Statement Balances');
	console.log('------------------------------------------------');
	console.log(bills);
	output = '';
	output += bills['PNC Bank:1524']?.statementBalance + '\n';
	output += bills['USAA:640']?.statementBalance + '\n';
	output += bills['Chase Bank:8396']?.statementBalance + '\n';
	output += bills['Chase Bank:7040']?.statementBalance + '\n';
	output +=
		bills["Lowe's Consumer Credit Card:0011"]?.statementBalance + '\n';
	output += bills['Target Credit Card:7509']?.statementBalance + '\n';
	console.log(output);

	console.log('------------------------------------------------');
	console.log('Total Balances');
	console.log('------------------------------------------------');
	output = '';
	output += bills['PNC Bank:1524']?.totalBalance + '\n';
	output += bills['USAA:640']?.totalBalance + '\n';
	output += bills['Chase Bank:8396']?.totalBalance + '\n';
	output += bills['Chase Bank:7040']?.totalBalance + '\n';
	output += bills["Lowe's Consumer Credit Card:0011"]?.totalBalance + '\n';
	output += bills['Target Credit Card:7509']?.totalBalance + '\n';
	console.log(output);

	console.log('------------------------------------------------');
	console.log('Ready to fetch balances. Click OK to continue');
	if (!confirm('Continue?')) {
		return;
	}

	// Now get providers with balances
	const providers_data = await fetch(
		'https://mint.intuit.com/mas/v1/providers',
		{
			headers: {
				accept: 'application/json',
				authorization:
					'Intuit_APIKey intuit_apikey=' +
					intuit_apikey +
					', intuit_apikey_version=1.0',
				'cache-control': 'no-cache',
				pragma: 'no-cache',
			},
		}
	).then((response) => response.json());

	const accounts = {
		'Credit Cards': {
			'FDS:urn:account:fdp::accountid:6de95256-a8f1-3886-b96f-9d0ff67043a3':
				null, // PNC
			'FDS:urn:account:fdp::accountid:9a3e9c80-b333-11ea-aebe-5abc7d9a808f':
				null, // USAA
			'FDS:urn:account:fdp::accountid:7d30e11e-331b-30c2-9e10-9392fa56b6cf':
				null, // Chase AZ
			'FDS:urn:account:fdp::accountid:b4f6b8f1-fb71-3699-bf35-3a39fc37b9a9':
				null, // Chase Freedom
			'FDS:urn:account:fdp::accountid:aec282b1-16f5-3f8e-ab0d-2905baf45953':
				null, // Lowes
			'FDS:urn:account:fdp::accountid:b02ae0df-56ce-397e-b07a-9377b4438457':
				null, // Target
		},
		'Assets & Investments': {
			'PFM:BankAccount:29095552_5729118': null, // PNC - G
			'PFM:BankAccount:29095552_5729119': null, // PNC - R
			'PFM:BankAccount:29095552_5729117': null, // PNC - S
			//'PFM:BankAccount:29095552_12708246': null, // PSECU
			// 'PFM:BankAccount:29095552_14563651': null, // Citadel
			// 'PFM:BankAccount:29095552_13974359': null, // Robinhood - C
			//'PFM:InvestmentAccount:29095552_13974360': null, // Robinhod - I
			//'PFM:InvestmentAccount:29095552_7525733': null, // Fidelity SIMPLE - C
			'PFM:InvestmentAccount:29095552_15145854': null, // Fidelity Individual TOD
			'PFM:InvestmentAccount:29095552_15145851': null, // Fidelity Traditional - C
			'PFM:InvestmentAccount:29095552_15145852': null, // Fidelity Traditional - K
			'PFM:BankAccount:29095552_14455307': null, // Bread - S
			'PFM:InvestmentAccount:29095552_12493034': null, // 529 - J
			'PFM:InvestmentAccount:29095552_12433891': null, // 529 - W
			'PFM:InvestmentAccount:29095552_15049948': null, // Vanguard
			// 'PFM:InvestmentAccount:29095552_13897950': null, // Worthy
			'PFM:RealEstateAccount:29095552_7644887': null, // Property - H
			'PFM:VehicleAccount:29095552_14563647': null, // Property - L
			'PFM:VehicleAccount:29095552_14290320': null, // Property - S
		},
		Loans: {
			'FDS:urn:account:fdp::accountid:c173c3a1-a7a3-11ec-855e-de66a375e743':
				null, // GreenSky
			// 'PFM:LoanAccount:29095552_14563650': null, // Citadel
		},
	};

	const other_accounts = {
		// everything else
	};

	for (const provider of providers_data.providers) {
		for (const account of provider.providerAccounts) {
			// console.log(account);
			for (const type in accounts) {
				if (account.id in accounts[type]) {
					accounts[type][account.id] = account;
				} else {
					other_accounts[account.id] = account;
				}
			}
		}
	}

	console.clear();
	for (const type in accounts) {
		console.log('------------------------------------------------');
		console.log(type);
		console.log('------------------------------------------------');
		output = '';
		for (const id in accounts[type]) {
			const account = accounts[type][id];
			output += account.currentBalance + '\n';
		}
		console.log(output);
	}

	console.log('------------------------------------------------');
	console.log('Use search interface for transaction review for now');

	// For debugging and when IDs change
	console.log(other_accounts);

	// ----------------------------------------------------------------------------------------------
	// See mint-transactions.js (disabled for now, broken by new Mint API)
}
main();
