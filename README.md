# ForexFactory Data Scraper API

This project provides a simple API to retrieve ForexFactory calendar data for a specific date. The API fetches and parses the event data from the ForexFactory website, making it easy to integrate financial event information into your applications.

---

## **Features**
- Scrapes ForexFactory calendar data for a given date.
- Returns all events with details such as time, currency, impact, event description, and actual/forecast/previous values.
- Built with **Puppeteer** and **Express** for scraping and API creation.
- Handles timezone settings for accurate data.

---

## **Technologies Used**
1. **Node.js**: JavaScript runtime for server-side development.
2. **Express.js**: Framework for building the REST API.
3. **Puppeteer**: Headless browser for web scraping.
4. **puppeteer-extra**: Enhances Puppeteer functionality.
5. **puppeteer-extra-plugin-stealth**: Helps avoid detection as a bot during web scraping.

---

## **Setup and Installation**

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-folder>

2. **Install dependencies:**
   ```bash
   npm install

3. **Run the application:**
   ```bash
    npm start   

4. **Make API Requests: Use the endpoint to fetch data.**


# **API Endpoint**

### GET /api/data

#### Request Parameters:
- **date** (required): The target date for fetching ForexFactory calendar data in the format `YYYY-MM-DD`.

#### Example Request:
   ```http
   GET /api/data?date=2024-11-20
```


### Example Response:
```json
{
    "events": [
        {
            "time": "8:30am",
            "currency": "USD",
            "impact": "High",
            "event": "Initial Jobless Claims",
            "actual": "250K",
            "forecast": "240K",
            "previous": "245K"
        },
        {
            "time": "10:00am",
            "currency": "EUR",
            "impact": "Medium",
            "event": "Consumer Confidence",
            "actual": "-15.0",
            "forecast": "-16.0",
            "previous": "-17.5"
        }
    ]
}
```

## **How It Works**

1. **Launches a Puppeteer browser instance with stealth mode to avoid bot detection.**
 
2. **Navigates to the ForexFactory calendar page for the specified date.**
 
3. **Optionally updates timezone settings via web interactions.**
 
4. **Extracts event data from the calendar table.**
 
5. **Returns the scraped data as JSON via an API endpoint.**
