	console.log( '------------------------------------------------' );
	console.log( 'Ready to fetch transactions. Click OK to continue' );
	if ( ! confirm( 'Continue?' ) ) {
		return;
	}

	for ( const provider of providers_data.providers ) {
		for ( const account of provider.providerAccounts ) {
			console.clear();

			let accountId = null;
			if ( 'domainIds' in account ) {
				for ( const domainId of account.domainIds ) {
					if ( domainId.domain === 'PFM' ) {
						accountId = domainId.id;
						// Split out end of ID
						accountId = accountId.replace( /^\d+_/i, '' );
					}
				}
			}

			if ( accountId === null ) {
				console.log(
					'No usable account ID found - needs investigation',
					account
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
				const transactions = [];
				for ( const transaction of transactions_data.set[ 0 ].data ) {
					if ( ! transaction.date.match( /\d{2}\/\d{2}\/\d{2}/ ) ) {
						transaction.date =
							transaction.date + ', ' + today.getFullYear();
					}

					const date_object = Date.parse( transaction.date );
					const elapsed = ( today - date_object ) / 86400000; // divide by milliseconds in a day

					// More than 30 days ago? Skip it
					if ( elapsed > 30 ) {
						continue;
					}

					transactions.push( {
						date: transaction.date,
						amount:
							( transaction.isDebit ? '-' : '' ) +
							transaction.amount,
						merchant: transaction.omerchant,
						// Might also want:
						//  - id - for uniqueness
						//  - merchant (prettier shorter name)
						//  - isSpending
						//  - isPending
						//  - isTransfer
						//  - category
					} );
				}

				// If no transactions, skip to next
				if ( transactions.length === 0 ) {
					continue;
				}

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
				console.table( transactions );
			}

			console.log( '------------------------------------------------' );
			console.log( 'Click OK to continue' );
			if ( ! confirm( 'Continue?' ) ) {
				return;
			}
		}
	}

	console.log( '-------------------------------', 'Done!' );
