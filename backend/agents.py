import os
import json
import asyncio
from typing import List, Callable, Optional, Awaitable
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# ---------------------------------------------------------------------------
# Pydantic Schemas for Structured Output
# ---------------------------------------------------------------------------

class WeatherForecast(BaseModel):
    temp_range: str = Field(description="Temperature range, e.g., '22°C - 30°C' or '72°F - 86°F'")
    condition: str = Field(description="General weather condition, e.g., 'Sunny with occasional showers'")
    clothing_advice: str = Field(description="Advice on what clothing to pack")
    warnings: List[str] = Field(default_factory=list, description="Any severe weather alerts or warnings")

class FlightOption(BaseModel):
    airline: str = Field(description="Airline name, e.g., 'Japan Airlines'")
    flight_number: str = Field(description="Flight number, e.g., 'JL 005'")
    departure_time: str = Field(description="Departure date and time")
    arrival_time: str = Field(description="Arrival date and time")
    duration: str = Field(description="Flight duration, e.g., '14h 15m'")
    price: float = Field(description="Total cost of flight in USD")
    cabin_class: str = Field(description="Cabin class, e.g., 'Economy', 'Business'")
    stops: int = Field(description="Number of layovers")

class FlightResponse(BaseModel):
    options: List[FlightOption]
    best_option: FlightOption

class HotelOption(BaseModel):
    name: str = Field(description="Hotel name")
    stars: float = Field(description="Star rating, e.g., 4.5")
    price_per_night: float = Field(description="Price per night in USD")
    total_price: float = Field(description="Total price for the duration in USD")
    address: str = Field(description="Hotel location or address")
    amenities: List[str] = Field(description="Key hotel amenities")
    reason_for_recommendation: str = Field(description="Why this hotel fits the traveler's request")

class HotelResponse(BaseModel):
    options: List[HotelOption]
    best_option: HotelOption

class Activity(BaseModel):
    name: str = Field(description="Name of attraction, restaurant, or event")
    description: str = Field(description="Short description of the activity and why the user would like it")
    estimated_cost: float = Field(description="Cost of activity in USD (0 for free)")
    category: str = Field(description="One of: 'Sightseeing', 'Food', 'Shopping', 'Event', 'Relaxation'")
    duration_hours: float = Field(description="Estimated duration of the activity in hours")

class ActivityResponse(BaseModel):
    activities: List[Activity]

class BudgetValidation(BaseModel):
    is_under_budget: bool = Field(description="True if total cost is <= user budget")
    total_estimated_cost: float = Field(description="Sum of flights, hotels, activities, and estimated food/misc")
    flight_cost: float
    hotel_cost: float
    activity_cost: float
    misc_cost: float = Field(description="Allocated cost for food, local transport, and miscellaneous items")
    reasoning: str = Field(description="Explanation of calculations and budget alignment")
    suggestions_for_adjustment: str = Field(description="Instructions on how to save money if budget is exceeded, empty otherwise")

class DayItinerary(BaseModel):
    day_number: int
    date: str
    theme: str = Field(description="Overall theme of the day, e.g., 'Exploring Historic Temples'")
    activities: List[Activity] = Field(description="List of scheduled activities for this day")
    lodging: str = Field(description="Note about current lodging/hotel")
    meals: List[str] = Field(description="List of suggested meals/dining spots for Breakfast, Lunch, Dinner")
    estimated_daily_cost: float

class FinalItinerary(BaseModel):
    destination: str
    dates: str
    total_budget: float
    total_cost: float
    weather_summary: WeatherForecast
    flight: FlightOption
    hotel: HotelOption
    daily_itinerary: List[DayItinerary]
    packing_list: List[str]
    budget_breakdown: BudgetValidation

# ---------------------------------------------------------------------------
# Base Agent Class & Helpers
# ---------------------------------------------------------------------------

class Agent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        api_key = os.getenv("GEMINI_API_KEY")
        
        # Initialize client if API key exists, otherwise enable mock fallback
        if api_key and not api_key.startswith("your_") and not api_key.startswith("mock_"):
            try:
                self.client = genai.Client(api_key=api_key)
                self.use_mock = False
            except Exception as e:
                print(f"Error initializing Gemini client for {self.name}: {e}. Falling back to mock data.")
                self.use_mock = True
        else:
            self.use_mock = True

    async def simulate_thinking(self, callback: Callable[[str, str], Awaitable[None]], delay: float = 1.5):
        """Simulate agent analysis time for visual feedback."""
        await asyncio.sleep(delay)

# ---------------------------------------------------------------------------
# Specialized Agents
# ---------------------------------------------------------------------------

class WeatherAgent(Agent):
    def __init__(self):
        super().__init__("Weather Agent", "Analyzes destination weather, climate conditions, and suggests clothing.")

    async def analyze(self, destination: str, dates: str, callback: Callable[[str, str], Awaitable[None]]) -> WeatherForecast:
        await callback(self.name, f"Checking typical weather conditions in {destination} for dates: {dates}...")
        await self.simulate_thinking(callback, 1.2)
        
        if self.use_mock:
            # High-quality mock weather data based on destination keywords
            dest_lower = destination.lower()
            if "tokyo" in dest_lower or "japan" in dest_lower:
                return WeatherForecast(
                    temp_range="24°C - 31°C (75°F - 88°F)",
                    condition="Warm and humid with intermittent summer showers.",
                    clothing_advice="Pack light, breathable cotton clothing. Bring a compact umbrella and light rain jacket.",
                    warnings=["High heat index during midday. Stay hydrated and seek shade."]
                )
            elif "paris" in dest_lower or "france" in dest_lower:
                return WeatherForecast(
                    temp_range="15°C - 26°C (59°F - 79°F)",
                    condition="Mild and pleasant, mostly sunny with light breezes.",
                    clothing_advice="Light layers, comfortable walking shoes, and a light sweater for the evening.",
                    warnings=[]
                )
            else:
                return WeatherForecast(
                    temp_range="18°C - 27°C (64°F - 81°F)",
                    condition="Generally fair with a mix of sun and clouds.",
                    clothing_advice="Casual summer clothes, with layers for cooler mornings and nights.",
                    warnings=[]
                )

        try:
            prompt = f"Analyze typical weather in {destination} during {dates}. Provide temperature range, general conditions, clothing advice, and alerts if any."
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=WeatherForecast
                )
            )
            return WeatherForecast.model_validate_json(response.text)
        except Exception as e:
            await callback(self.name, f"Gemini error: {e}. Falling back to mock data.")
            self.use_mock = True
            return await self.analyze(destination, dates, callback)

class FlightAgent(Agent):
    def __init__(self):
        super().__init__("Flight Agent", "Finds available flights, calculates durations, and selects the best option.")

    async def search_flights(self, origin: str, destination: str, dates: str, budget: float, callback: Callable[[str, str], Awaitable[None]], is_revised: bool = False) -> FlightResponse:
        rev_prefix = "Revised search: " if is_revised else ""
        await callback(self.name, f"{rev_prefix}Searching flight options from {origin} to {destination} for dates {dates}...")
        await self.simulate_thinking(callback, 1.8)

        if self.use_mock:
            dest_lower = destination.lower()
            if "tokyo" in dest_lower:
                opt1 = FlightOption(airline="Japan Airlines", flight_number="JL 005", departure_time="11:45 AM", arrival_time="3:15 PM (+1 Day)", duration="14h 30m", price=1250.0, cabin_class="Economy", stops=0)
                opt2 = FlightOption(airline="United Airlines", flight_number="UA 79", departure_time="10:15 AM", arrival_time="4:45 PM (+1 Day)", duration="17h 30m", price=980.0, cabin_class="Economy", stops=1)
                opt3 = FlightOption(airline="Air Canada", flight_number="AC 009", departure_time="8:00 AM", arrival_time="5:30 PM (+1 Day)", duration="18h 30m", price=850.0, cabin_class="Economy", stops=1)
            elif "paris" in dest_lower:
                opt1 = FlightOption(airline="Air France", flight_number="AF 007", departure_time="7:30 PM", arrival_time="8:45 AM (+1 Day)", duration="7h 15m", price=820.0, cabin_class="Economy", stops=0)
                opt2 = FlightOption(airline="Delta Air Lines", flight_number="DL 264", departure_time="5:15 PM", arrival_time="6:30 AM (+1 Day)", duration="7h 15m", price=780.0, cabin_class="Economy", stops=0)
                opt3 = FlightOption(airline="Icelandair", flight_number="FI 614", departure_time="8:40 PM", arrival_time="12:05 PM (+1 Day)", duration="10h 25m", price=550.0, cabin_class="Economy", stops=1)
            else:
                opt1 = FlightOption(airline="Generic Airways", flight_number="GA 101", departure_time="9:00 AM", arrival_time="2:00 PM", duration="5h 00m", price=450.0, cabin_class="Economy", stops=0)
                opt2 = FlightOption(airline="Budget Jet", flight_number="BJ 502", departure_time="6:00 AM", arrival_time="1:00 PM", duration="7h 00m", price=290.0, cabin_class="Economy", stops=1)
                opt3 = FlightOption(airline="Standard Flyer", flight_number="SF 303", departure_time="2:00 PM", arrival_time="9:30 PM", duration="7h 30m", price=380.0, cabin_class="Economy", stops=1)
            
            options = [opt1, opt2, opt3]
            # If revised (budget cut request), choose the cheapest, otherwise recommend the best balance
            best = opt3 if (is_revised or budget < 2000) else opt1
            await callback(self.name, f"Identified {len(options)} options. Recommended: {best.airline} ({best.flight_number}) for ${best.price}.")
            return FlightResponse(options=options, best_option=best)

        try:
            prompt = (
                f"Find realistic flight routes and prices from {origin} to {destination} for dates {dates}. "
                f"User's overall budget is ${budget}. Provide 3 options (non-stop and layovers) with realistic prices, times, and flight numbers. "
                f"{'CRITICAL: Prioritize the cheapest possible flights to fit a tight budget constraint.' if is_revised else ''}"
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FlightResponse
                )
            )
            res = FlightResponse.model_validate_json(response.text)
            await callback(self.name, f"Recommended flight: {res.best_option.airline} at ${res.best_option.price}.")
            return res
        except Exception as e:
            await callback(self.name, f"Gemini error: {e}. Falling back to mock data.")
            self.use_mock = True
            return await self.search_flights(origin, destination, dates, budget, callback, is_revised)

class HotelAgent(Agent):
    def __init__(self):
        super().__init__("Hotel Agent", "Searches lodging options, filters by budget and reviews, and recommends the best option.")

    async def search_hotels(self, destination: str, dates: str, nights: int, budget: float, callback: Callable[[str, str], Awaitable[None]], is_revised: bool = False) -> HotelResponse:
        rev_prefix = "Revised search: " if is_revised else ""
        await callback(self.name, f"{rev_prefix}Searching hotels in {destination} for {nights} nights...")
        await self.simulate_thinking(callback, 1.6)

        if self.use_mock:
            dest_lower = destination.lower()
            if "tokyo" in dest_lower:
                opt1 = HotelOption(name="Shinjuku Granbell Hotel", stars=4.0, price_per_night=180.0, total_price=180.0*nights, address="Kabukicho, Shinjuku, Tokyo", amenities=["Free Wi-Fi", "Rooftop Bar", "English speaking staff"], reason_for_recommendation="Trendy location in Shinjuku, excellent city views and close to transit.")
                opt2 = HotelOption(name="Hotel Gracery Shinjuku", stars=4.5, price_per_night=220.0, total_price=220.0*nights, address="Kabukicho, Shinjuku, Tokyo", amenities=["Free Wi-Fi", "Godzilla Terrace", "Breakfast Buffet"], reason_for_recommendation="Premium experience next to the Godzilla landmark, super convenient and spacious rooms.")
                opt3 = HotelOption(name="Capsule Hotel Anshin Oyado", stars=3.5, price_per_night=70.0, total_price=70.0*nights, address="Shinjuku, Tokyo", amenities=["Free Wi-Fi", "Onsen/Sauna", "Complimentary soft drinks"], reason_for_recommendation="Authentic, clean, and highly budget-friendly capsule hotel experience.")
            elif "paris" in dest_lower:
                opt1 = HotelOption(name="Hotel Regina Louvre", stars=5.0, price_per_night=350.0, total_price=350.0*nights, address="Rue de Rivoli, Paris", amenities=["Free Wi-Fi", "Eiffel Tower View", "Bar & Lounge"], reason_for_recommendation="Luxury historic stay directly opposite the Louvre Museum.")
                opt2 = HotelOption(name="Hotel Caron de Beaumarchais", stars=3.0, price_per_night=160.0, total_price=160.0*nights, address="Le Marais, Paris", amenities=["Free Wi-Fi", "Air Conditioning", "French Breakfast"], reason_for_recommendation="Charming boutique hotel reflecting 18th-century Parisian style in the trendy Le Marais.")
                opt3 = HotelOption(name="Generator Paris Hostel", stars=3.0, price_per_night=60.0, total_price=60.0*nights, address="10th Arrondissement, Paris", amenities=["Free Wi-Fi", "Rooftop Terrace", "Bicycle Rental"], reason_for_recommendation="Extremely economical and stylish design hostel, great for budget travelers.")
            else:
                opt1 = HotelOption(name="Comfort Inn Center", stars=3.5, price_per_night=120.0, total_price=120.0*nights, address="City Center", amenities=["Free Breakfast", "Free Wi-Fi", "Gym"], reason_for_recommendation="Good location with standard comforts and free breakfast.")
                opt2 = HotelOption(name="Plaza Luxury Suites", stars=4.5, price_per_night=250.0, total_price=250.0*nights, address="Downtown", amenities=["Free Wi-Fi", "Pool", "Spa", "Valet Parking"], reason_for_recommendation="Upscale hotel with comprehensive wellness facilities.")
                opt3 = HotelOption(name="Budget Inn Motel", stars=2.5, price_per_night=60.0, total_price=60.0*nights, address="Suburbs", amenities=["Free Wi-Fi", "Parking"], reason_for_recommendation="Cheapest option outside the center, saving maximum budget.")

            options = [opt1, opt2, opt3]
            best = opt3 if (is_revised or budget < 1500) else opt1
            await callback(self.name, f"Found {len(options)} hotels. Recommended: {best.name} at ${best.price_per_night}/night (Total: ${best.total_price}).")
            return HotelResponse(options=options, best_option=best)

        try:
            prompt = (
                f"Find realistic hotels in {destination} for a stay of {nights} nights. "
                f"Overall budget is ${budget}. Provide 3 options ranging from luxury to budget-friendly. "
                f"Calculate the total_price as price_per_night * {nights}. "
                f"{'CRITICAL: The budget is tight. You must recommend the cheapest available hotel option.' if is_revised else ''}"
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=HotelResponse
                )
            )
            res = HotelResponse.model_validate_json(response.text)
            await callback(self.name, f"Recommended hotel: {res.best_option.name} at ${res.best_option.price_per_night}/night.")
            return res
        except Exception as e:
            await callback(self.name, f"Gemini error: {e}. Falling back to mock data.")
            self.use_mock = True
            return await self.search_hotels(destination, dates, nights, budget, callback, is_revised)

class ActivityAgent(Agent):
    def __init__(self):
        super().__init__("Activity Agent", "Suggests sightseeing, dining, events, and shopping activities based on user preferences.")

    async def get_activities(self, destination: str, preferences: str, callback: Callable[[str, str], Awaitable[None]], is_revised: bool = False) -> ActivityResponse:
        rev_prefix = "Revised suggestion: " if is_revised else ""
        await callback(self.name, f"{rev_prefix}Researching points of interest in {destination} for interests: '{preferences}'...")
        await self.simulate_thinking(callback, 1.8)

        if self.use_mock:
            dest_lower = destination.lower()
            if "tokyo" in dest_lower:
                acts = [
                    Activity(name="Akihabara Electric Town tour", description="Explore anime shops, maid cafes, and retro video game stores.", estimated_cost=25.0, category="Shopping", duration_hours=3.5),
                    Activity(name="Sushi making masterclass in Tsukiji", description="Learn from a professional chef and eat your creations.", estimated_cost=80.0, category="Food", duration_hours=3.0),
                    Activity(name="Senso-ji Temple in Asakusa", description="Tokyo's oldest and most iconic Buddhist temple.", estimated_cost=0.0, category="Sightseeing", duration_hours=2.0),
                    Activity(name="Shibuya Crossing & Hachiko Statue", description="Walk the famous crossing and view the city from Shibuya Sky.", estimated_cost=15.0, category="Sightseeing", duration_hours=1.5),
                    Activity(name="Ramen tasting in Shinjuku Golden Gai", description="Sample different regional ramen varieties in tiny traditional alleyways.", estimated_cost=30.0, category="Food", duration_hours=2.0),
                    Activity(name="Meiji Shrine and Harajuku fashion street", description="Tranquil forest shrine next to the colorful fashion hub Takeshita St.", estimated_cost=0.0, category="Shopping", duration_hours=3.0),
                ]
            elif "paris" in dest_lower:
                acts = [
                    Activity(name="Eiffel Tower Summit Access", description="Ride the elevator to the top of Paris's iconic structure.", estimated_cost=40.0, category="Sightseeing", duration_hours=2.5),
                    Activity(name="Louvre Museum Guided Tour", description="Skip-the-line tour of the world's largest art museum.", estimated_cost=65.0, category="Sightseeing", duration_hours=3.0),
                    Activity(name="Macaron Baking Class", description="Learn how to bake traditional French macarons in a historic kitchen.", estimated_cost=75.0, category="Food", duration_hours=2.0),
                    Activity(name="Strolling along the Seine River at sunset", description="Beautiful views of Notre-Dame and historic bridges.", estimated_cost=0.0, category="Relaxation", duration_hours=1.5),
                    Activity(name="Vintage Shopping in Le Marais", description="Browse vintage fashion and modern designers in the historic quarter.", estimated_cost=0.0, category="Shopping", duration_hours=3.0),
                ]
            else:
                acts = [
                    Activity(name="City Landmarks Tour", description="Bus and walking tour of the most famous sights.", estimated_cost=35.0, category="Sightseeing", duration_hours=4.0),
                    Activity(name="Local Food Tasting Walk", description="Explore regional dishes with a local guide.", estimated_cost=50.0, category="Food", duration_hours=2.5),
                    Activity(name="Central Park Relaxation", description="Enjoy the local gardens and scenery.", estimated_cost=0.0, category="Relaxation", duration_hours=2.0),
                    Activity(name="Downtown Shopping & Souvenirs", description="Explore local markets and boutique shops.", estimated_cost=0.0, category="Shopping", duration_hours=2.0),
                ]
            
            if is_revised:
                # Filter out expensive activities, keep low cost/free ones
                acts = [a for a in acts if a.estimated_cost <= 30.0]
                await callback(self.name, f"Scaled down activity selections to {len(acts)} low-cost or free activities.")
            else:
                await callback(self.name, f"Identified {len(acts)} recommended attractions and dining locations.")
            return ActivityResponse(activities=acts)

        try:
            prompt = (
                f"Suggest at least 5 realistic, detailed activities in {destination} aligning with the user preferences: '{preferences}'. "
                f"For each activity, specify the estimated cost in USD, the category, and duration. "
                f"{'CRITICAL: The budget has been exceeded! Select mostly FREE or VERY CHEAP activities.' if is_revised else ''}"
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ActivityResponse
                )
            )
            res = ActivityResponse.model_validate_json(response.text)
            await callback(self.name, f"Selected {len(res.activities)} tailored activities.")
            return res
        except Exception as e:
            await callback(self.name, f"Gemini error: {e}. Falling back to mock data.")
            self.use_mock = True
            return await self.get_activities(destination, preferences, callback, is_revised)

class BudgetAgent(Agent):
    def __init__(self):
        super().__init__("Budget Agent", "Aggregates all costs, compares to total budget, and provides adjustments if needed.")

    async def validate_budget(self, total_budget: float, flight: FlightOption, hotel: HotelOption, activities: List[Activity], nights: int, callback: Callable[[str, str], Awaitable[None]]) -> BudgetValidation:
        await callback(self.name, f"Calculating total travel expenses against budget of ${total_budget}...")
        await self.simulate_thinking(callback, 1.5)

        flight_cost = flight.price
        hotel_cost = hotel.total_price
        activity_cost = sum(act.estimated_cost for act in activities)
        # Allocate $60/day for food and miscellaneous expenses
        misc_cost = 60.0 * (nights + 1)
        total_estimated = flight_cost + hotel_cost + activity_cost + misc_cost
        
        is_under = total_estimated <= total_budget
        
        if self.use_mock:
            if is_under:
                reasoning = (
                    f"The total estimated cost is ${total_estimated:.2f}, which is within your budget of ${total_budget:.2f}. "
                    f"Flights (${flight_cost:.2f}) and Hotels (${hotel_cost:.2f}) account for the majority of the budget. "
                    f"Activities (${activity_cost:.2f}) and Daily Food/Transport allowance (${misc_cost:.2f}) are well-allocated."
                )
                suggestions = ""
            else:
                reasoning = (
                    f"The total estimated cost is ${total_estimated:.2f}, exceeding your budget of ${total_budget:.2f} by ${total_estimated - total_budget:.2f}. "
                    f"Flights (${flight_cost:.2f}) and Hotel (${hotel_cost:.2f}) exceed the target threshold."
                )
                suggestions = (
                    "Reduce lodging costs by switching to a budget or mid-range hotel. "
                    "Select lower-cost flights (e.g. flights with layovers) and swap out paid activities for free local sights."
                )
            
            await callback(self.name, f"Evaluation complete. Status: {'UNDER BUDGET' if is_under else 'OVER BUDGET'}. Total: ${total_estimated:.2f}")
            return BudgetValidation(
                is_under_budget=is_under,
                total_estimated_cost=total_estimated,
                flight_cost=flight_cost,
                hotel_cost=hotel_cost,
                activity_cost=activity_cost,
                misc_cost=misc_cost,
                reasoning=reasoning,
                suggestions_for_adjustment=suggestions
            )

        try:
            prompt = (
                f"Calculate the total expenses. "
                f"Flight cost: ${flight_cost}, Hotel total cost: ${hotel_cost} for {nights} nights, "
                f"Activity total cost: ${activity_cost}, Food/Misc allowance: ${misc_cost}. "
                f"Total Budget: ${total_budget}. "
                f"Analyze if these costs are under budget. If not under budget, explain why and provide exact instructions "
                f"on how the other agents should adjust their choices (e.g. 'find a hotel under $100/night', 'remove activities over $40')."
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BudgetValidation
                )
            )
            res = BudgetValidation.model_validate_json(response.text)
            await callback(self.name, f"Evaluation complete. Total estimated: ${res.total_estimated_cost:.2f} (Under budget: {res.is_under_budget}).")
            return res
        except Exception as e:
            await callback(self.name, f"Gemini error: {e}. Falling back to mock data.")
            self.use_mock = True
            return await self.validate_budget(total_budget, flight, hotel, activities, nights, callback)

class ItineraryAgent(Agent):
    def __init__(self):
        super().__init__("Itinerary Agent", "Combines flights, hotel details, weather forecasts, and activities into a structured itinerary.")

    async def generate_itinerary(self, destination: str, dates: str, budget: float, flight: FlightOption, hotel: HotelOption, activities: List[Activity], weather: WeatherForecast, budget_val: BudgetValidation, callback: Callable[[str, str], Awaitable[None]]) -> FinalItinerary:
        await callback(self.name, "Structuring all components into a polished day-by-day itinerary...")
        await self.simulate_thinking(callback, 2.0)

        if self.use_mock:
            # Generate day-by-day mock itinerary
            import datetime
            try:
                # Attempt to parse date range (e.g., "July 10-17" or "2026-07-10 to 2026-07-17")
                start_date_str = dates.split("–")[0].strip() if "–" in dates else dates.split("-")[0].strip()
                # Parse default format
                start_date = datetime.datetime.strptime(f"2026 {start_date_str}", "%Y %B %d")
            except Exception:
                start_date = datetime.datetime.now()

            daily_plans = []
            num_days = len(activities) // 2
            if num_days < 3:
                num_days = 4
            
            for i in range(1, num_days + 1):
                cur_date = start_date + datetime.timedelta(days=i-1)
                date_str = cur_date.strftime("%B %d, %Y")
                
                # Assign some activities to this day
                idx = (i - 1) * 2
                day_acts = activities[idx:idx+2] if idx < len(activities) else []
                if not day_acts:
                    day_acts = [Activity(name="Leisurely Exploration", description=f"Stroll around the scenic streets of {destination}.", estimated_cost=0, category="Relaxation", duration_hours=2.0)]
                
                daily_plans.append(DayItinerary(
                    day_number=i,
                    date=date_str,
                    theme=f"Discovering local wonders - Day {i}",
                    activities=day_acts,
                    lodging=hotel.name if i < num_days else "Check-out of hotel",
                    meals=["Local Cafe", "Authentic Eatery", "Recommended Restaurant"],
                    estimated_daily_cost=sum(a.estimated_cost for a in day_acts)
                ))
            
            packing = ["Comfortable walking shoes", "Travel adaptors / chargers", "Passports and copies", "Umbrella", "Weather-appropriate clothing"]
            if "cotton" in weather.clothing_advice.lower():
                packing.append("Light breathable cotton t-shirts")
            if "rain" in weather.clothing_advice.lower() or "umbrella" in weather.clothing_advice.lower():
                packing.append("Raincoat / umbrella")

            await callback(self.name, "Itinerary formatting complete! Passing final dashboard structure.")
            return FinalItinerary(
                destination=destination,
                dates=dates,
                total_budget=budget,
                total_cost=budget_val.total_estimated_cost,
                weather_summary=weather,
                flight=flight,
                hotel=hotel,
                daily_itinerary=daily_plans,
                packing_list=packing,
                budget_breakdown=budget_val
            )

        try:
            # We construct a summary object to feed into Itinerary Agent
            prompt = (
                f"Combine all details into a structured itinerary for a trip to {destination} during {dates}. "
                f"Total budget is ${budget}. Total cost is ${budget_val.total_estimated_cost}. "
                f"Flights: {flight.airline} {flight.flight_number} departing {flight.departure_time}. "
                f"Hotel: {hotel.name} at {hotel.address}. "
                f"Selected Activities: {json.dumps([a.model_dump() for a in activities])}. "
                f"Weather Forecast: {weather.condition}, Temperature {weather.temp_range}, Advice: {weather.clothing_advice}. "
                f"Create a day-by-day itinerary showing check-in/out, activity scheduling, meal recommendations, and daily costs. "
                f"Produce a practical packing list based on the weather advice."
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FinalItinerary
                )
            )
            res = FinalItinerary.model_validate_json(response.text)
            await callback(self.name, "Itinerary successfully formatted and structured.")
            return res
        except Exception as e:
            await callback(self.name, f"Gemini error: {e}. Falling back to mock data.")
            self.use_mock = True
            return await self.generate_itinerary(destination, dates, budget, flight, hotel, activities, weather, budget_val, callback)

# ---------------------------------------------------------------------------
# Coordinator Agent - Handles Multi-Agent Workflow Loop
# ---------------------------------------------------------------------------

class TravelCoordinatorAgent(Agent):
    def __init__(self):
        super().__init__("Travel Coordinator Agent", "Orchestrates the travel planning system, assigns tasks, and compiles results.")
        self.weather_agent = WeatherAgent()
        self.flight_agent = FlightAgent()
        self.hotel_agent = HotelAgent()
        self.activity_agent = ActivityAgent()
        self.budget_agent = BudgetAgent()
        self.itinerary_agent = ItineraryAgent()

    async def plan_trip(self, origin: str, destination: str, dates: str, budget: float, preferences: str, callback: Callable[[str, str], Awaitable[None]]) -> FinalItinerary:
        await callback(self.name, f"Received request: {origin} to {destination}, Dates: {dates}, Budget: ${budget}, Preferences: {preferences}.")
        await self.simulate_thinking(callback, 1.0)
        
        # Calculate nights
        # We can parse the dates or assume a default of 7 nights if not clear
        nights = 7
        try:
            # Basic parsing of range, e.g. "July 10-17" -> 17 - 10 = 7
            import re
            nums = re.findall(r'\d+', dates)
            if len(nums) >= 2:
                n = int(nums[1]) - int(nums[0])
                if 0 < n < 30:
                    nights = n
        except Exception:
            pass
        
        # Step 1: Run Weather Agent and Activity Agent in parallel, or sequence. Let's do Weather first
        weather = await self.weather_agent.analyze(destination, dates, callback)
        
        # Step 2: Search initial Flight option
        flight_res = await self.flight_agent.search_flights(origin, destination, dates, budget, callback)
        flight = flight_res.best_option
        
        # Step 3: Search initial Hotel option
        hotel_res = await self.hotel_agent.search_hotels(destination, dates, nights, budget, callback)
        hotel = hotel_res.best_option
        
        # Step 4: Get Activities
        activity_res = await self.activity_agent.get_activities(destination, preferences, callback)
        activities = activity_res.activities
        
        # Step 5: Validate Budget
        budget_val = await self.budget_agent.validate_budget(budget, flight, hotel, activities, nights, callback)
        
        # Step 6: Loop if over budget (Attempt 2)
        if not budget_val.is_under_budget:
            await callback(self.name, f"Budget Agent flagged the plan as OVER BUDGET by ${budget_val.total_estimated_cost - budget:.2f}. Running cost-optimization cycle...")
            
            # Revision search
            flight_res = await self.flight_agent.search_flights(origin, destination, dates, budget, callback, is_revised=True)
            flight = flight_res.best_option
            
            hotel_res = await self.hotel_agent.search_hotels(destination, dates, nights, budget, callback, is_revised=True)
            hotel = hotel_res.best_option
            
            activity_res = await self.activity_agent.get_activities(destination, preferences, callback, is_revised=True)
            activities = activity_res.activities
            
            # Re-evaluate
            budget_val = await self.budget_agent.validate_budget(budget, flight, hotel, activities, nights, callback)
            if not budget_val.is_under_budget:
                await callback(self.name, "Budget Agent: Recommended modifications have optimized costs as much as possible, but total still exceeds budget. Proceeding with warning.")
            else:
                await callback(self.name, "Budget Agent: Budget adjustments successful! Plan is now compliant.")

        # Step 7: Create Final day-by-day Itinerary
        final_plan = await self.itinerary_agent.generate_itinerary(
            destination, dates, budget, flight, hotel, activities, weather, budget_val, callback
        )
        
        await callback(self.name, "All agent tasks complete! Travel plan assembled successfully.")
        return final_plan
