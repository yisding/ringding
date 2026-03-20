Stubhub / ticket price scraper

Features:

1. A Playwright runner that will go to a website and capture the relevant website DOM (after any relevant javascript finishes running).
2. Something that will convert the website DOM into Markdown, and then passes it to a LLM to get the relevant fields.
3. Save the pricing data into a SQLLite database for now. Leave the option open for connecting to a Postgres database in the future.
4. An UI to enter the website URL and set a scraping frequency.
5. Some kind of email alerts system (including UI) so that we can track when the cheapest ticket exceeds a certain price or the average ticket price today is 10% higher or lower than the trailing 30 day average.