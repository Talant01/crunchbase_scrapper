const fs = require('fs')
const puppeteer = require('puppeteer');

async function getPage(term) {
	try {
		const browser = await puppeteer.launch({
			headless: false,
			slowMo: 10
		});

		const page = await browser.newPage();
		page.on('console', consoleObj => console.log(consoleObj.text()));

		await page.goto(term);
		await page.waitForSelector('.multiple-sections')

		const curData = await page.evaluate(() => {
			function camelize(str) {
				return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
					return index === 0 ? word.toLowerCase() : word.toUpperCase();
				}).replace(/\s+/g, '');
			}

			const dataCompany = {
				summary: {
					about: {},
					highlights: {},
					details: {}
				},
				investments: {

				}
			}

			//About
			const container1 = document.querySelectorAll('.one-of-many-section')[0]
			const description = container1.querySelector('profile-section mat-card .description').innerText
			const infoList = container1.querySelectorAll('ul li')
			const cdk = document.querySelector('#cdk-describedby-message-container')

			infoList.forEach(elem => {
				const label = elem.querySelector('field-formatter').innerText
				const altClass = elem.querySelector('theme-icon').getAttribute('aria-describedby')
				const altLabel = cdk.querySelector(`#${altClass}`).innerHTML
				dataCompany.summary.about[camelize(altLabel)] = label
			})

			dataCompany.summary.about.description = description

			// highlights
			const container2 = document.querySelectorAll('.one-of-many-section')[1]
			const content = container2.querySelectorAll('profile-section mat-card anchored-values .spacer')

			content.forEach((elem) => {
				let label = elem.querySelector('.info label-with-info').innerText
				const value = elem.querySelector('.info field-formatter').innerText
				label = camelize(label)

				dataCompany.summary.highlights[label] = value
			})

			// Details
			const mainContent = document.querySelector('.main-content')
			const expDescription = document.querySelectorAll('description-card > div')[1]
			const textValueContent = mainContent.querySelectorAll('ul.text_and_value li')

			textValueContent.forEach(elem => {
				let label = elem.querySelector('.wrappable-label-with-info').innerText
				const value = elem.querySelector('field-formatter').innerText

				dataCompany.summary.details[camelize(label)] = value
			})
			expDescription.classList.add('expanded');
			dataCompany.summary.details.description = expDescription.innerText

			return dataCompany
		})

		await browser.close()
		return curData
	} catch (e) {
		console.log(e);
		if (e.name === 'TimeoutError') {
			return getPage(term)
		}
	}
}

const start = async () => {
	const data = JSON.parse(await fs.readFileSync('data.json'))
	const res = []

	const curData = await getPage(data[0].crunchbaseURL)
	console.log(curData)
	//fs.writeFileSync('test.json', JSON.stringify(curData))
	/*data.forEach(async (item) => {
		if (item.crunchbaseURL !== undefined) {
			const $ = await getPage(item.crunchbaseURL)
			exit(0)
		}
	});*/

}

start();
