import puppeteer from 'puppeteer-extra';
import { JSDOM } from 'jsdom';
import express from 'express';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';


puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;
const monthNames = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

async function getHtmlAndExtractInformationCurrency(date) {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();


    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.goto(`https://www.forexfactory.com`, { waitUntil: 'domcontentloaded' });

        const csrfToken = await page.evaluate(() => {
            const csrfInput = document.querySelector('input[name="_csrf"]');
            return csrfInput ? csrfInput.value : null;
        });

        await page.evaluate(async (csrfToken) => {
            const response = await fetch('https://www.forexfactory.com/timezone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': '*/*'
                },
                body: new URLSearchParams({
                    _csrf: csrfToken,
                    timezone: 'Etc/UTC',
                    'options[timeformat]': '0',
                    redirect_uri: `/`
                })


            });
        }, csrfToken);

        await page.goto(`https://www.forexfactory.com/calendar?day=${date}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.calendar__table');
        const tableHTML = await page.evaluate(() => {
            const table = document.querySelector('.calendar__table');
            return table ? table.innerHTML : 'Table not found';
        });
        const results = await extractInformationFromTable(tableHTML);
        return results
    } catch (error) {
        console.error('Error fetching page:', error);
        throw error;
    } finally {
        await browser.close();
    }
}



function extractInformationFromTable(table) {
    const dom = new JSDOM(`<table>${table}</table>`);
    const rows = dom.window.document.querySelectorAll('.calendar__row');
    const result = [];
    let lastTime = ""


    rows.forEach((row, index) => {

        const currencyTdElement = row.querySelector('.calendar__currency');
        let currency;
        if (currencyTdElement != null) {
            const currencyElement = currencyTdElement.querySelector('span');
            if (currencyElement != null) {
                currency = currencyElement.innerHTML ? currencyElement.innerHTML : "";
            }
        }


        const actualTdElement = row.querySelector('.calendar__actual');
        let actual;
        let actualColor = "black"
        if (actualTdElement != null) {
            const actualElement = actualTdElement.querySelector('span');
            if (actualElement != null) {
                actual = actualElement.innerHTML ? actualElement.innerHTML : "";
                let classesActual = [...actualElement.classList]
                if (classesActual.includes("better")) {
                    actualColor = "green"
                } else if (classesActual.includes("worse")) {
                    actualColor = "red"
                } else {
                    actualColor = "black"
                }
            } else {
                actual = ""
            }
        } else {
            actual = ""
        }


        const forecastTdElement = row.querySelector('.calendar__forecast');
        let forecast;
        if (forecastTdElement != null) {
            const forecastElement = forecastTdElement.querySelector('span');
            if (forecastElement != null) {
                forecast = forecastElement.innerHTML ? forecastElement.innerHTML : ""
            } else {
                forecast = ""
            }
        } else {
            forecast = ""
        }


        const previousTdElement = row.querySelector('.calendar__previous');
        let previous;
        let previousColor = "black"
        if (previousTdElement != null) {
            const previousElement = previousTdElement.querySelector('span');
            if (previousElement != null) {
                if (previousElement.innerHTML.includes("span")) {
                    previous = previousElement.innerHTML ? previousElement.innerHTML.split("<span")[0] : ""
                    let classes = [...previousElement.classList]
                    if (classes.includes("better")) {
                        previousColor = "green"
                    } else if (classes.includes("worse")) {
                        previousColor = "red"
                    } else {
                        previousColor = "black"
                    }
                } else {
                    previous = previousElement.innerHTML ? previousElement.innerHTML : ""
                }
            } else {
                previous = ""
            }
        } else {
            previous = ""
        }

        const calendarEventTdElement = row.querySelector('.calendar__event');
        let event;
        if (calendarEventTdElement != null) {
            const calendarEventDivElement = calendarEventTdElement.querySelector('div');
            if (calendarEventDivElement != null) {
                const calendarEventElement = calendarEventTdElement.querySelector('span');
                if (calendarEventElement != null) {
                    event = calendarEventElement.innerHTML ? calendarEventElement.innerHTML : "";
                } else {
                    event = ""
                }
            } else {
                event = ""
            }
        } else {
            event = ""
        }

        const impactTdElement = row.querySelector('.calendar__impact');
        let impact;
        if (impactTdElement != null) {
            const impactElement = impactTdElement.querySelector('span');
            if (impactElement != null) {
                let title = impactElement.title
                if (title.includes("Low")) {
                    impact = "Low"
                } else if (title.includes("Medium")) {
                    impact = "Medium"
                } else if (title.includes("High")) {
                    impact = "High"
                } else if (title.includes("Non-Economic")) {
                    impact = "Non-Economic"
                } else {
                    impact = "Low"
                }
            } else {
                impact = ""
            }
        } else {
            impact = ""
        }



        const timeTdElement = row.querySelector('.calendar__time');
        let time;
        if (timeTdElement != null) {
            const timeDivElement = timeTdElement.querySelector('div');
            if (timeDivElement != null) {
                const timeElement = timeDivElement.querySelectorAll('span');
                if (timeElement != null) {
                    if (timeElement.length > 1) {
                        lastTime = timeElement[1].innerHTML
                        time = lastTime
                    } else {
                        lastTime = timeElement[0].innerHTML
                        time = lastTime
                    }
                } else {
                    time = lastTime
                }
            } else {
                time = lastTime
            }
        } else {
            time = lastTime
        }


        if (currency) {
            result.push({
                time,
                currency,
                impact,
                event,
                actual,
                actualColor,
                forecast,
                previous,
                previousColor
            });
        }
    });
    return result
}


async function fetchDataWithRetry(maxRetries, date) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await getHtmlAndExtractInformationCurrency(date);
            return { isSuccessFull: true, result };
        } catch (error) {
            if (attempt === maxRetries) {
                return { isSuccessFull: false, error: 'Failed to fetch data after retrying' };
            }
        }
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month}${day}.${year}`;
}


app.get('/api/data', async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({
            isSuccessFull: false,
            message: 'Date is required'
        });
    }
    try {
        const formattedDate = formatDate(date);
        const data = await fetchDataWithRetry(1, formattedDate);
        if (data.isSuccessFull) {
            res.status(200).json(data);
        } else {
            res.status(500).json({
                isSuccessFull: false,
                message: 'Failed to fetch data after retrying'
            });
        }
    } catch (error) {
        res.status(500).json({ isSuccessFull: false, message: 'Error fetching data', error: error.message });
    }

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});