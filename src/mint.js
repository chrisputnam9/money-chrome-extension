const intuit_apikey = window.MintConfig.browserAuthAPIKey;

async function main() {
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
	).then( ( response ) => response.json() );

	const accounts = {
		'Credit Cards': {
			'FDS:urn:account:fdp::accountid:6de95256-a8f1-3886-b96f-9d0ff67043a3': null,
			'FDS:urn:account:fdp::accountid:9a3e9c80-b333-11ea-aebe-5abc7d9a808f': null,
			'FDS:urn:account:fdp::accountid:7d30e11e-331b-30c2-9e10-9392fa56b6cf': null,
			'FDS:urn:account:fdp::accountid:b4f6b8f1-fb71-3699-bf35-3a39fc37b9a9': null,
			'FDS:urn:account:fdp::accountid:aec282b1-16f5-3f8e-ab0d-2905baf45953': null,
			'FDS:urn:account:fdp::accountid:b02ae0df-56ce-397e-b07a-9377b4438457': null,
		},
		'Assets & Investments': {
			'PFM:BankAccount:29095552_5729118': null,
			'PFM:BankAccount:29095552_5729119': null,
			'PFM:BankAccount:29095552_5729117': null,
			'PFM:BankAccount:29095552_12708246': null,
			'PFM:BankAccount:29095552_13974359': null,
			'PFM:InvestmentAccount:29095552_13974360': null,
			'PFM:InvestmentAccount:29095552_7525733': null,
			'PFM:InvestmentAccount:29095552_12493034': null,
			'PFM:InvestmentAccount:29095552_12433891': null,
			'PFM:InvestmentAccount:29095552_12433895': null,
			'PFM:InvestmentAccount:29095552_13897950': null,
			'PFM:RealEstateAccount:29095552_7644887': null,
			'PFM:VehicleAccount:29095552_14290319': null,
			'PFM:VehicleAccount:29095552_14290320': null,
		},
	};

	const other_accounts = {
		// everything else
	};

	for ( const provider of providers_data.providers ) {
		for ( const account of provider.providerAccounts ) {
			for ( const type in accounts ) {
				if ( account.id in accounts[ type ] ) {
					accounts[ type ][ account.id ] = account;
				} else {
					other_accounts[ account.id ] = account;
				}
			}
		}
	}

	console.clear();
	for ( const type in accounts ) {
		console.log( '------------------------------------------------' );
		console.log( type );
		console.log( '------------------------------------------------' );
		let output = '';
		for ( const id in accounts[ type ] ) {
			const account = accounts[ type ][ id ];
			output += account.currentBalance + '\n';
		}
		console.log( output );
	}

	console.log( '------------------------------------------------' );
	console.log( 'Ready to fetch transactions. Click OK to continue' );
	//if ( ! confirm( 'Continue?' ) ) {
	//return;
	//}

	for ( const provider of providers_data.providers ) {
		for ( const account of provider.providerAccounts ) {
			console.clear();

			let accountId = null;
			if ( 'domainIds' in account ) {
				for ( const domainId of account.domainIds ) {
					if ( domainId.domain === 'PFM' ) {
						accountId = domainId.id;
					}
				}
			}

			// Split out end of ID
			accountId = accountId.replace( /^\d+_/i, '' );

			if ( accountId === null ) {
				console.log(
					'No usable account ID found - needs investigation'
				);
			} else {
				// Get transactions (most recent 100 - or as set by interface)
				const transactions_data = await fetch(
					'https://mint.intuit.com/app/getJsonData.xevent?accountId=' +
						accountId +
						'&filterType=&queryNew=&offset=0&comparableType=8&acctChanged=T&task=transactions%2Ctxnfilters&rnd=77&typeSort=8',
					{
						headers: {
							accept: 'application/json',
							'cache-control': 'no-cache',
							pragma: 'no-cache',
						},
					}
				).then( ( response ) => response.json() );

				// Process transactions - from last 30 days
				// TODO

				// If no transactions, skip to next
				// TODO

				console.log(
					'------------------------------------------------'
				);
				console.log(
					'Transactions for ' +
						provider.name +
						' - ' +
						account.name +
						' (' +
						account.accountNumberLast4 +
						')'
				);
				console.log(
					'------------------------------------------------'
				);

				// Display transactions in table format
				// TODO
				console.log( transactions_data );
			}

			console.log( '------------------------------------------------' );
			//return;
			console.log( 'Click OK to continue' );
			if ( ! confirm( 'Continue?' ) ) {
				return;
			}
		}
	}

	console.log( '-------------------------------', 'Done!' );
}
main();
