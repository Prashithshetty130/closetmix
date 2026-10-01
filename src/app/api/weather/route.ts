import { NextResponse } from "next/server";
import { getCityWeather } from "@/lib/weather";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "New York";

    const weather = await getCityWeather(city);
    return NextResponse.json({ success: true, weather });
  } catch (error: any) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch weather" }, { status: 500 });
  }
}
