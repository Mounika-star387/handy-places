# Local Compass

Yes 👍 If you are going to create the entire web application only by giving a prompt to an AI coding tool, use one detailed prompt. I’ll also add price/budget, distance, time, ratings, quality, family/normal restaurant, etc.

🚀 Complete Prompt

Create a complete, modern, responsive web application called "LocalSpot".

PURPOSE:
LocalSpot is a location-based web application that helps users find nearby restaurants, fast-food shops, medical stores, general stores, supermarkets, cafes, bakeries, and other local businesses.

The application should automatically use the user's current location and show nearby places with accurate information.

IMPORTANT:
Do not use fake or randomly generated business information when real location/business data is available. Use a suitable Maps/Places API or business-location API. Keep API keys secure using environment variables.

--------------------------------------------------
1. HOME PAGE
--------------------------------------------------

Create a beautiful homepage with:

• LocalSpot logo/name
• Search bar
• "Use My Location" button
• Current location display
• Category buttons
• Nearby places section
• Interactive map
• Popular categories
• Best-rated places
• Open-now places

Search examples:

"Restaurants near me"
"Fast food near me"
"Medical stores near me"
"Family restaurants"
"General stores"
"Restaurants under ₹500"
"Best restaurants within 3 km"

--------------------------------------------------
2. CATEGORIES
--------------------------------------------------

Provide these categories:

• Restaurants
• Family Restaurants
• Normal Restaurants
• Fast Food
• Cafes
• Bakeries
• Medical Stores / Pharmacies
• Hospitals
• General Stores / Kirana Stores
• Supermarkets
• Other Local Shops

--------------------------------------------------
3. LOCATION
--------------------------------------------------

Use browser Geolocation API to detect:

• Latitude
• Longitude

Ask for location permission.

If permission is denied:

• Allow the user to manually enter a location.
• Provide a location search option.

Show:

"Your Location: Tadepalligudem"

or the detected area/city.

--------------------------------------------------
4. BUSINESS INFORMATION
--------------------------------------------------

For every business display:

• Business name
• Category
• Address
• Distance
• Estimated travel time
• Rating
• Number of reviews
• Price range
• Opening time
• Closing time
• Open / Closed status
• Phone number
• Website if available
• Directions
• Photos if available

Example card:

--------------------------------
🍴 ABC Family Restaurant

⭐ 4.5 (1,245 reviews)

Indian • Biryani • Chinese

📍 1.8 km away
🚗 6 min

💰 ₹300 – ₹600 for two

🟢 Open Now
Closes at 10:30 PM

👨‍👩‍👧 Family Friendly

Food Quality: ⭐ 4.4
Service: ⭐ 4.2
Cleanliness: ⭐ 4.3

[View Details] [Directions]
--------------------------------

--------------------------------------------------
5. PRICE / BUDGET
--------------------------------------------------

Add price filters.

For restaurants:

• Under ₹200
• ₹200 – ₹500
• ₹500 – ₹1,000
• ₹1,000+

Also display:

"Approximate cost for two"

Examples:

₹200 for two
₹350 for two
₹500 for two
₹800 for two

For other businesses, show price information only when reliable data is available.

Never invent prices.

--------------------------------------------------
6. DISTANCE FILTER
--------------------------------------------------

Allow users to select:

• Within 500 m
• Within 1 km
• Within 3 km
• Within 5 km
• Within 10 km

Display distance like:

850 m away
1.2 km away
3.5 km away

--------------------------------------------------
7. TRAVEL TIME
--------------------------------------------------

Show estimated travel time.

Examples:

🚶 Walking: 12 min
🚗 Driving: 5 min

Use a routing/directions API whenever possible.

Do not invent travel times.

--------------------------------------------------
8. RATING FILTER
--------------------------------------------------

Allow users to filter:

⭐ 3+
⭐ 3.5+
⭐ 4+
⭐ 4.5+

Show:

Rating
Review count

Example:

⭐ 4.6 (2,345 reviews)

--------------------------------------------------
9. QUALITY INFORMATION
--------------------------------------------------

For restaurants, display available quality information:

• Food Quality
• Taste
• Service
• Cleanliness
• Ambience

Create an overall quality score only when sufficient review/data information exists.

Example:

Food Quality: 4.5/5
Service: 4.2/5
Cleanliness: 4.4/5
Ambience: 4.3/5

Overall Quality: 4.4/5

IMPORTANT:
Do not present an AI-estimated quality score as an official fact.
Clearly label estimated/review-derived information.

--------------------------------------------------
10. RESTAURANT TYPE
--------------------------------------------------

For restaurants identify/filter:

• Family Restaurant
• Normal Restaurant
• Fast Food
• Cafe
• Bakery
• Vegetarian
• Non-Vegetarian
• Vegetarian & Non-Vegetarian

Add filters:

[Family Friendly]
[Fast Food]
[Vegetarian]
[Open Now]

--------------------------------------------------
11. OPENING HOURS
--------------------------------------------------

Show:

🟢 Open Now
🔴 Closed

Also show:

Opens at 11:00 AM
Closes at 10:30 PM

Add:

"Open Now" filter.

--------------------------------------------------
12. MAP
--------------------------------------------------

Add an interactive map.

Show every nearby business as a map marker.

When the user clicks a marker, display:

• Business name
• Rating
• Price
• Distance
• Open/Closed
• Directions button

Allow users to switch between:

[List View]
[Map View]

--------------------------------------------------
13. SEARCH AND SMART FILTERING
--------------------------------------------------

Create a natural-language search feature.

The user can type:

"Best family restaurant within 3 km"

"Restaurant under ₹500"

"Fast food near me"

"Medical store open now"

"Best rated restaurant within 5 km"

"Cheap restaurant near me"

"Family restaurant with rating above 4"

Convert the user's request into appropriate filters.

Example:

User:
"Find a family restaurant within 3 km, rating above 4.2 and price below ₹600."

Automatically apply:

Category = Restaurant
Family Friendly = Yes
Distance <= 3 km
Rating >= 4.2
Price <= ₹600

--------------------------------------------------
14. SORTING
--------------------------------------------------

Provide:

• Nearest
• Highest Rated
• Most Reviewed
• Lowest Price
• Best Overall
• Open Now

--------------------------------------------------
15. BUSINESS DETAILS PAGE
--------------------------------------------------

When the user clicks a business, show a complete details page.

Include:

• Large image
• Business name
• Rating
• Reviews
• Category
• Address
• Phone
• Website
• Price
• Opening hours
• Food type
• Family friendly
• Food quality
• Service
• Cleanliness
• Reviews
• Location on map
• Directions

Buttons:

[Call]
[Directions]
[Website]
[Share]

--------------------------------------------------
16. PERSONALIZED RECOMMENDATIONS
--------------------------------------------------

Create a "Recommended For You" section.

Examples:

🔥 Best Rated Near You
💰 Best Budget Restaurants
👨‍👩‍👧 Best Family Restaurants
🍔 Best Fast Food
🕐 Open Now
📍 Closest Places
⭐ Most Reviewed

--------------------------------------------------
17. UI DESIGN
--------------------------------------------------

Design should be modern and professional.

Use:

• Clean cards
• Rounded corners
• Icons
• Search bar
• Category chips
• Responsive layout
• Mobile-friendly navigation
• Desktop map + list layout
• Smooth hover effects
• Loading animations
• Empty-state messages

The design should feel like a combination of a local discovery app and a map application.

--------------------------------------------------
18. TECHNICAL REQUIREMENTS
--------------------------------------------------

Build the application using:

Frontend:
HTML
CSS
JavaScript
Bootstrap or modern CSS

Backend:
Python Flask

Database:
SQLite + SQLAlchemy

Use APIs for:

• Location
• Places/business search
• Maps
• Routing
• Reviews/ratings where available

Keep all API keys in .env.

Never expose secret API keys in frontend code.

--------------------------------------------------
19. ERROR HANDLING
--------------------------------------------------

Handle:

• Location permission denied
• Location unavailable
• API failure
• No businesses found
• Invalid search
• Network error
• Missing business information

Display friendly messages.

Example:

"No restaurants found within 3 km. Try increasing the distance."

--------------------------------------------------
20. IMPORTANT DATA RULES
--------------------------------------------------

Never fabricate:

• Business names
• Ratings
• Reviews
• Prices
• Opening hours
• Distances
• Travel times
• Food quality

If information is unavailable, display:

"Information unavailable"

Clearly distinguish between:

Official business information
User reviews
Estimated information

--------------------------------------------------
21. FINAL USER EXPERIENCE
--------------------------------------------------

A user opens LocalSpot.

The app asks for location permission.

After location is detected:

"Places Near You"

appears.

The user can select:

🍴 Restaurants
🍔 Fast Food
💊 Medical
🛒 General Stores
☕ Cafes
🏪 Supermarkets

Then the user can apply:

Distance
Rating
Price
Open Now
Family Friendly
Category

The application displays businesses in both list and map format.

Each result should clearly show:

NAME
⭐ RATING
📍 DISTANCE
🚗 TRAVEL TIME
💰 PRICE
🕐 OPEN/CLOSED
🍴 CATEGORY
⭐ QUALITY
👨‍👩‍👧 FAMILY FRIENDLY

Create the entire application with a professional UI and working frontend/backend functionality.

First generate the complete project structure, then generate all required files and code. Make sure the application can be run locally without missing dependencies.


⭐ Main idea

Your final result will be something like:

“Restaurants near me”

PlaceRatingDistanceTimePriceTypeRestaurant A⭐4.61.2 km5 min₹400/2FamilyRestaurant B⭐4.3800 m3 min₹250/2Fast FoodRestaurant C⭐4.73.1 km10 min₹600/2Family

And the user can simply say:

“Show me a family restaurant within 5 km, rating above 4.3, open now, and under ₹500 for two.”

Your application automatically filters the results.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/66bf7d19-0812-4e6a-8998-dfdc54fa300c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
