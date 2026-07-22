import { jsPDF } from 'jspdf';

export function downloadPDF(itinerary) {
  const doc = new jsPDF();
  const { 
    destination, dates, flight, hotel, weather_summary, 
    daily_itinerary, total_cost, total_budget 
  } = itinerary;

  // Header Title styling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("VoyagerAI Travel Planner", 20, 22);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Personalized Itinerary for: ${destination}`, 20, 30);
  doc.text(`Travel Dates: ${dates}`, 20, 36);

  // Decorative header line
  doc.setDrawColor(139, 92, 246); // violet-500 color accent
  doc.setLineWidth(1);
  doc.line(20, 42, 190, 42);

  // Summary Grid details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Flight Details", 20, 52);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Airline: ${flight.airline} (${flight.flight_number}) - ${flight.cabin_class}`, 20, 58);
  doc.text(`Layovers: ${flight.stops === 0 ? "Non-stop" : `${flight.stops} Layovers`} | Duration: ${flight.duration}`, 20, 63);
  doc.text(`Price: $${flight.price.toLocaleString()} USD`, 20, 68);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Hotel Details", 110, 52);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Hotel: ${hotel.name} (${hotel.stars} Stars)`, 110, 58);
  doc.text(`Address: ${hotel.address}`, 110, 63);
  doc.text(`Price: $${hotel.total_price.toLocaleString()} USD total`, 110, 68);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Weather Outlook", 20, 78);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Temperature Range: ${weather_summary.temp_range}`, 20, 84);
  doc.text(`Condition: ${weather_summary.condition}`, 20, 89);
  
  // Wrap weather clothing advice
  const adviceLines = doc.splitTextToSize(`Advice: ${weather_summary.clothing_advice}`, 170);
  doc.text(adviceLines, 20, 94);

  // Financial summary
  const weatherHeight = adviceLines.length * 5;
  const dividerY = 94 + weatherHeight + 4;
  
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(20, dividerY, 190, dividerY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`Total Budget: $${total_budget.toLocaleString()} USD`, 20, dividerY + 8);
  doc.text(`Calculated Cost: $${total_cost.toLocaleString()} USD`, 110, dividerY + 8);

  // Daily Schedule
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Daily Schedule Details", 20, dividerY + 20);

  let y = dividerY + 28;
  daily_itinerary.forEach((day) => {
    // Add page if close to bottom
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    // Day Header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 92, 246); // violet-500
    doc.text(`DAY ${day.day_number}: ${day.date} — ${day.theme}`, 20, y);
    y += 6;

    // Lodging and meals
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(`Lodging: ${day.lodging}  |  Suggested Meals: ${day.meals ? day.meals.join(", ") : "Local spots"}`, 20, y);
    y += 6;

    // Activities
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    day.activities.forEach((act) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Activity title line
      doc.setFont("helvetica", "bold");
      doc.text(`• [${act.category}] ${act.name} (Est. Cost: ${act.estimated_cost === 0 ? "Free" : `$${act.estimated_cost}`})`, 22, y);
      y += 5;
      
      // Activity description
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(act.description, 160);
      descLines.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 26, y);
        y += 4.5;
      });
      y += 1.5;
    });
    
    y += 4; // Padding between days
  });

  // Save the document
  const fileName = `itinerary_${destination.toLowerCase().replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
